import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import Event from '../models/event.model.js';
import { Assignment } from '../models/assignment.model.js';
import { recordAuditLog } from '../utils/logger.js';

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.header('Cache-Control', 'no-store');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filters: any = { status: { $ne: 'disposed' } };
        const andConditions: any[] = [];

        // Manual departmentId filter (useful for Admin/Superuser)
        if (req.query.departmentId) {
            filters.departmentId = req.query.departmentId;
        }

        // Filter by branch
        // For superusers, allow filtering by query param
        if (req.user.role === 'superuser') {
            if (req.query.branchId && req.query.branchId !== 'ALL') {
                filters.branchId = req.query.branchId;
            }
        } else {
            // For non-superusers, we handle branch scoping within the access conditions below
            // to allow seeing assigned assets from other branches
        }

        if (req.query.category) filters.category = req.query.category;

        // Support multiple statuses (e.g. status=active,storage)
        if (req.query.status) {
            const statusStr = req.query.status as string;
            if (statusStr.includes(',')) {
                filters.status = { $in: statusStr.split(',') };
            } else {
                filters.status = statusStr;
            }
        }

        if (req.query.locationId) filters.locationId = req.query.locationId;

        // RBAC / Branch Filtering
        if (req.user && req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId;

            // Force branch filter for everyone except superusers
            filters.branchId = userBranchId;

            const accessConditions: any[] = [];

            if (req.user.departmentId && !['admin', 'system_admin'].includes(req.user.role)) {
                const deptIds = [req.user.departmentId];
                if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                    deptIds.push(...(req.user as any).managedDepartments);
                }

                accessConditions.push({
                    departmentId: { $in: deptIds }
                });
            } else if (!['admin', 'system_admin'].includes(req.user.role) && req.user.department) {
                accessConditions.push({
                    department: req.user.department
                });
            } else {
                // If user has no department, but has a branch, allow seeing all assets in that branch
                // No extra conditions needed as branchId is already in filters
            }

            if (accessConditions.length > 0) {
                andConditions.push({ $or: accessConditions });
            }
        } else if (req.user.role === 'superuser') {
            // Superusers see all branches by default, 
            // but can filter if a specific branchId is provided
            if (req.query.branchId && req.query.branchId !== 'ALL') {
                filters.branchId = req.query.branchId;
            }
        }

        if (req.query.search) {
            andConditions.push({
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { serial: { $regex: req.query.search, $options: 'i' } },
                    { model: { $regex: req.query.search, $options: 'i' } }
                ]
            });
        }

        if (andConditions.length > 0) {
            filters.$and = andConditions;
        }
        console.log('DEBUG FILTER QUERY:', JSON.stringify(filters));

        const assets = await Asset.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('departmentId', 'name')
            .populate('locationId', 'name');

        const totalOptions = Object.keys(filters).length === 0 ? {} : filters;
        const total = await Asset.countDocuments(totalOptions);

        res.json({
            data: assets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // RBAC: Check if user can access this asset (Branch + Department)
        if (req.user && req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId?.toString() || (req.user as any).branchId;
            const assetBranchId = asset.branchId?.toString() || asset.branchId;

            // Strict branch check
            if (userBranchId !== assetBranchId) {
                return res.status(403).json({ message: 'Access denied: Asset belongs to another branch' });
            }

            // Department check for non-privileged roles
            if (!['admin', 'system_admin'].includes(req.user.role)) {
                const deptIds = [];
                if (req.user.departmentId) deptIds.push(req.user.departmentId.toString());
                if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                    deptIds.push(...(req.user as any).managedDepartments.map((id: any) => id.toString()));
                }

                const isDeptMatch =
                    (asset.departmentId && deptIds.includes(asset.departmentId.toString())) ||
                    (asset.department && req.user.department && asset.department === req.user.department);

                if (!isDeptMatch) {
                    // Check if assigned to user
                    const assignment = await Assignment.findOne({
                        assetId: asset._id,
                        userId: req.user._id,
                        status: 'assigned',
                        isDeleted: false
                    });

                    if (!assignment) {
                        return res.status(403).json({ message: 'Access denied' });
                    }
                }
            }
        }

        // Fetch children (assets contained in this asset)
        const children = await Asset.find({ parentAssetId: asset._id }).select('name serial model category status');

        const assetObj = asset.toJSON();
        (assetObj as any).children = children;

        res.json(assetObj);
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // RBAC: Non-admin users can only create assets in their department
        // UPDATE: Technicians and Managers can create assets for ANY department in their branch
        if (req.user && !['superuser', 'admin', 'manager', 'technician'].includes(req.user.role)) {
            if (req.body.departmentId && req.body.departmentId !== req.user.departmentId) {
                return res.status(403).json({ message: 'You can only create assets in your department' });
            }
            // Auto-assign to user's department if not specified
            if (!req.body.departmentId) {
                req.body.departmentId = req.user.departmentId;
                if (!req.body.department && req.user.department) {
                    req.body.department = req.user.department;
                }
            }
        }

        const asset = new Asset({
            ...req.body,
            // Set branchId based on user role
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId
        });

        // Auto-assign to Warehouse if no location specified
        if (!asset.locationId && asset.departmentId) {
            const { Location } = await import('../models/location.model.js');
            const warehouse = await Location.findOne({
                departmentId: asset.departmentId,
                isWarehouse: true,
                branchId: asset.branchId
            });

            if (warehouse) {
                asset.locationId = warehouse._id;
                asset.location = warehouse.name;
            } else {
                // Fallback to any warehouse in branch
                const anyWarehouse = await Location.findOne({
                    branchId: asset.branchId,
                    isWarehouse: true
                });
                if (anyWarehouse) {
                    asset.locationId = anyWarehouse._id;
                    asset.location = anyWarehouse.name;
                }
            }
        }

        // Auto-set status based on location for new assets if not explicitly provided
        if (!req.body.status && req.body.locationId) {
            const { Location } = await import('../models/location.model.js');
            const targetLocation = await Location.findById(req.body.locationId);
            if (targetLocation && !targetLocation.isWarehouse) {
                asset.status = 'in_use';
            } else if (targetLocation && targetLocation.isWarehouse) {
                asset.status = 'active';
            }
        }

        await asset.save();

        // Record Audit Log
        await recordAuditLog({
            userId: req.user._id,
            action: 'create',
            resourceType: 'Asset',
            resourceId: asset._id.toString(),
            resourceName: asset.name,
            details: `Created new asset: ${asset.name} (${asset.serial})`,
            branchId: (req.user as any).branchId?.toString(),
            departmentId: asset.departmentId?.toString()
        });

        res.status(201).json(asset);
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existingAsset = await Asset.findById(req.params.id);
        if (!existingAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // RBAC: Check if user can update this asset
        // UPDATE: Technicians and Managers can update assets regardless of department (in their branch)
        if (req.user && !['superuser', 'admin', 'manager', 'technician'].includes(req.user.role)) {
            const isDeptMatch =
                (existingAsset.departmentId && req.user.departmentId && existingAsset.departmentId.toString() === req.user.departmentId.toString()) ||
                (existingAsset.department && req.user.department && existingAsset.department === req.user.department);

            if (!isDeptMatch) {
                return res.status(403).json({ message: 'You can only update assets from your department' });
            }
            // Prevent changing department to one you don't own
            if (req.body.departmentId && req.body.departmentId !== req.user.departmentId) {
                // If they have no departmentId yet but matching string, we should probably allow setting it to THEIR departmentId
                if (req.user.departmentId) {
                    req.body.departmentId = req.user.departmentId;
                } else {
                    return res.status(403).json({ message: 'You cannot transfer assets to other departments' });
                }
            }
        }

        const updateData = { ...req.body };
        // Superusers can change branchId if provided
        if (req.user.role === 'superuser' && req.body.branchId) {
            updateData.branchId = req.body.branchId;
        } else {
            // Non-superusers cannot change branchId
            delete updateData.branchId;
        }

        // Auto-update status if location changed
        // ONLY if current status is active, storage or in_use
        // We PROTECT 'assigned' and 'maintenance' statuses from being overwritten by location changes
        const currentStatus = updateData.status || existingAsset.status;
        const statusProtected = ['assigned', 'maintenance', 'retired', 'disposed', 'request maintenance'].includes(currentStatus);

        if (!statusProtected && updateData.locationId && updateData.locationId !== existingAsset.locationId?.toString()) {
            const { Location } = await import('../models/location.model.js');
            const targetLocation = await Location.findById(updateData.locationId);
            if (targetLocation && !targetLocation.isWarehouse) {
                updateData.status = 'in_use';
            } else if (targetLocation && targetLocation.isWarehouse) {
                // If returned to warehouse, set back to active/spare
                updateData.status = 'active';
            }
        }

        const asset = await Asset.findByIdAndUpdate(req.params.id, updateData, { new: true });

        // Record Audit Log
        if (asset) {
            await recordAuditLog({
                userId: req.user._id,
                action: 'update',
                resourceType: 'Asset',
                resourceId: asset._id.toString(),
                resourceName: asset.name,
                details: `Updated asset: ${asset.name}. Changes: ${Object.keys(req.body).join(', ')}`,
                branchId: (req.user as any).branchId?.toString(),
                departmentId: asset.departmentId?.toString()
            });
        }

        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const existingAsset = await Asset.findById(req.params.id);
        if (!existingAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // RBAC: Check if user can delete this asset
        // UPDATE: Technicians and Managers can delete assets regardless of department
        if (req.user && !['superuser', 'admin', 'manager', 'technician'].includes(req.user.role)) {
            const isDeptMatch =
                (existingAsset.departmentId && req.user.departmentId && existingAsset.departmentId.toString() === req.user.departmentId.toString()) ||
                (existingAsset.department && req.user.department && existingAsset.department === req.user.department);

            if (!isDeptMatch) {
                return res.status(403).json({ message: 'You can only delete assets from your department' });
            }
        }

        await Asset.findByIdAndDelete(req.params.id);

        // Record Audit Log
        await recordAuditLog({
            userId: req.user._id,
            action: 'delete',
            resourceType: 'Asset',
            resourceId: existingAsset._id.toString(),
            resourceName: existingAsset.name,
            details: `Deleted asset: ${existingAsset.name} (${existingAsset.serial})`,
            branchId: (req.user as any).branchId?.toString(),
            departmentId: existingAsset.departmentId?.toString()
        });

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        next(error);
    }
};

import { MaintenanceRecord } from '../models/maintenance.model.js';
import Rental from '../models/rental.model.js';

export const getInventoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};

        // Filter by branch
        if (req.user.role === 'superuser') {
            if (req.query.branchId && req.query.branchId !== 'ALL') {
                filter.branchId = req.query.branchId;
            }
        } else {
            filter.branchId = (req.user as any).branchId;
        }

        let assetIds: any[] = [];

        // RBAC: Filter stats by department for non-admin users
        // Aligned with getAssets logic: admin/manager/technician see entire branch
        if (req.user && !['superuser', 'admin', 'system_admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                const deptIds = [req.user.departmentId];
                if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                    deptIds.push(...(req.user as any).managedDepartments);
                }
                filter.departmentId = { $in: deptIds };
            } else {
                // No department = no stats
                return res.json({
                    totalAssets: 0,
                    outsideService: 0,
                    unassigned: 0,
                    maintenanceCount: 0
                });
            }
        }
        // Get all asset IDs matching the filter (to cross-reference with other collections)
        const assets = await Asset.find(filter).select('_id');
        assetIds = assets.map(a => a._id);

        const totalAssets = await Asset.countDocuments(filter);

        // 1. Outside Service: Maintenance Tickets with status 'External Service'
        const outsideService = await MaintenanceRecord.countDocuments({
            asset: { $in: assetIds },
            status: 'External Service'
        });

        // 2. Unassigned: Assets with status 'active' or 'storage' (Available for assignment)
        // Note: 'assigned' is a distinct status in the model enum.
        const unassigned = await Asset.countDocuments({
            ...filter,
            status: { $in: ['active', 'storage'] }
        });

        // 3. Maintenance + Rental
        // Assets in maintenance status
        const assetsInMaintenance = await Asset.countDocuments({ ...filter, status: 'maintenance' });

        // Assets in rental (active rentals)
        const activeRentals = await Rental.countDocuments({
            assetId: { $in: assetIds },
            status: 'active'
        });

        const maintenanceCount = assetsInMaintenance + activeRentals;

        // Total Value (Keep existing logic if needed, but UI asked to replace it? 
        // Prompt: "ganti total value dengan total outside servicing". 
        // So I will return 'outsideService' instead of value or alongside it. 
        // The frontend expects a shape. I will send the new fields.

        res.json({
            totalAssets,
            outsideService,
            unassigned,
            maintenanceCount
        });
    } catch (error) {
        next(error);
    }
};

export const getAvailableAssetsForEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startTime, endTime, excludeEventId, departmentId } = req.query;

        if (!startTime || !endTime) {
            return res.status(400).json({ message: 'startTime and endTime are required' });
        }

        const start = new Date(startTime as string);
        const end = new Date(endTime as string);

        // Find conflicting events
        const conflictingEvents = await Event.find({
            _id: { $ne: excludeEventId }, // Exclude current event if editing
            status: { $ne: 'cancelled' },
            $or: [
                { startTime: { $lt: end }, endTime: { $gt: start } } // Overlap logic
            ]
        }).select('rentedAssets.assetId');

        // Extract Asset IDs explicitly booked
        const bookedAssetIds = conflictingEvents.flatMap(e => e.rentedAssets.map(ra => ra.assetId.toString()));

        // Find assets not in booked list
        const query: any = {
            _id: { $nin: bookedAssetIds },
            status: 'active', // Only show active assets as requested
            'rentalRates.0': { $exists: true }
        };

        // Enforce branch and department filtering
        if (req.user && req.user.role !== 'superuser') {
            query.branchId = (req.user as any).branchId;
            // Enforce department for everyone except top roles (Admin, etc)
            // Manager is now restricted to their department as requested
            if (!['admin', 'system_admin'].includes(req.user.role)) {
                if (req.user.departmentId) {
                    query.departmentId = req.user.departmentId;
                } else if (departmentId) {
                    query.departmentId = departmentId;
                }
            } else if (departmentId) {
                // Admins can filter by department if provided (e.g. from event)
                query.departmentId = departmentId;
            }
        } else if (req.user && req.user.role === 'superuser') {
            if (req.query.branchId && req.query.branchId !== 'ALL') {
                query.branchId = req.query.branchId;
            }
            if (departmentId) {
                query.departmentId = departmentId;
            }
        }

        const assets = await Asset.find(query);

        res.json(assets);

    } catch (error) {
        next(error);
    }
};

// Install Asset into a Panel/Container
export const installAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { parentAssetId, locationId, slotNumber } = req.body;
        const userId = req.user?._id;

        const asset = await Asset.findById(id);
        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Support both parentAsset (nested asset) and locationId (rack/panel)
        let parentName = 'Target';
        if (parentAssetId) {
            const parentAsset = await Asset.findById(parentAssetId);
            if (!parentAsset) return res.status(404).json({ success: false, message: 'Panel Asset not found' });

            asset.parentAssetId = parentAssetId;
            asset.locationId = parentAsset.locationId;
            asset.location = parentAsset.location;
            parentName = parentAsset.name;
        } else if (locationId) {
            const { Location } = await import('../models/location.model.js');
            const location = await Location.findById(locationId);
            if (!location) return res.status(404).json({ success: false, message: 'Location not found' });

            asset.locationId = locationId;
            asset.location = location.name;
            asset.parentAssetId = null;
            parentName = location.name;
        }

        // Update Asset
        asset.slotNumber = slotNumber;
        asset.status = 'in_use'; // Auto-update status

        // Log Activity
        asset.activityLog.push({
            action: 'installed',
            details: `Installed in ${parentName} at Slot ${slotNumber}`,
            performedBy: userId,
            date: new Date()
        });

        await asset.save();

        // Record Audit Log
        await recordAuditLog({
            userId: userId,
            action: 'install',
            resourceType: 'Asset',
            resourceId: asset._id.toString(),
            resourceName: asset.name,
            details: `Installed asset in ${parentName} at Slot ${slotNumber}`,
            branchId: (req.user as any).branchId?.toString(),
            departmentId: asset.departmentId?.toString()
        });

        res.status(200).json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
};

// Dismantle Asset from a Panel/Container
export const dismantleAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const asset = await Asset.findById(id);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        const previousParentId = asset.parentAssetId;
        let parentName = 'Panel';
        if (previousParentId) {
            const parent = await Asset.findById(previousParentId);
            if (parent) parentName = parent.name;
        }

        // Update Asset
        asset.parentAssetId = null; // Mongoose compliant for ObjectId
        asset.slotNumber = null;    // Mongoose compliant for Number
        asset.status = 'active'; // Auto-update status to Active/Spare

        // Find Department Warehouse to move asset back to
        if (asset.departmentId) {
            const { Location } = await import('../models/location.model.js');
            const warehouse = await Location.findOne({
                departmentId: asset.departmentId,
                isWarehouse: true,
                branchId: asset.branchId
            });

            if (warehouse) {
                asset.locationId = warehouse._id;
                asset.location = warehouse.name;
            } else {
                // Fallback to any warehouse in branch
                const anyWarehouse = await Location.findOne({
                    branchId: asset.branchId,
                    isWarehouse: true
                });
                if (anyWarehouse) {
                    asset.locationId = anyWarehouse._id;
                    asset.location = anyWarehouse.name;
                }
            }
        }

        // Log Activity
        asset.activityLog.push({
            action: 'dismantled',
            details: `Dismantled from ${parentName} and returned to warehouse`,
            performedBy: userId,
            date: new Date()
        });

        await asset.save();

        // Record Audit Log
        await recordAuditLog({
            userId: userId,
            action: 'dismantle',
            resourceType: 'Asset',
            resourceId: asset._id.toString(),
            resourceName: asset.name,
            details: `Dismantled asset from ${parentName} and returned to warehouse`,
            branchId: (req.user as any).branchId?.toString(),
            departmentId: asset.departmentId?.toString()
        });

        res.status(200).json({ success: true, data: asset });
    } catch (error) {
        next(error);
    }
};
