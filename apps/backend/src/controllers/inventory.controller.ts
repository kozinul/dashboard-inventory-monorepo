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
        // Only superuser can see all branches
        if (req.user.role === 'superuser') {
            if (req.query.branchId && req.query.branchId !== 'ALL') {
                filters.branchId = req.query.branchId;
            }
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

        // RBAC / Branch & Department Filtering
        if (req.user && req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId;

            // Force branch filter for all non-superuser roles
            filters.branchId = userBranchId;

            // Department check: system_admin sees all departments in their branch, others are restricted
            if (req.user.role !== 'system_admin') {
                const accessConditions: any[] = [];

                const deptIds: any[] = [];
                if (req.user.departmentId) deptIds.push(req.user.departmentId);
                if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                    deptIds.push(...(req.user as any).managedDepartments);
                }

                // Also allow assets specifically assigned to this user, regardless of department
                const assignedAssets = await Assignment.find({
                    userId: req.user._id,
                    status: 'assigned',
                    isDeleted: { $ne: true }
                }).select('assetId');

                const assignedAssetIds = assignedAssets.map(a => a.assetId);

                if (deptIds.length > 0) {
                    accessConditions.push({
                        departmentId: { $in: deptIds }
                    });
                } else if (req.user.department) {
                    accessConditions.push({
                        department: req.user.department
                    });
                }

                if (assignedAssetIds.length > 0) {
                    accessConditions.push({
                        _id: { $in: assignedAssetIds }
                    });
                }

                if (accessConditions.length > 0) {
                    andConditions.push({ $or: accessConditions });
                }
            }
        }

        if (req.query.isContainer !== undefined) {
            const isContainer = req.query.isContainer === 'true';
            filters.isContainer = isContainer;
        }

        if (req.query.unassigned === 'true') {
            filters.parentAssetId = null;
        }

        if (req.query.search) {
            andConditions.push({
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { alias: { $regex: req.query.search, $options: 'i' } },
                    { serial: { $regex: req.query.search, $options: 'i' } },
                    { model: { $regex: req.query.search, $options: 'i' } }
                ]
            });
        }

        if (andConditions.length > 0) {
            filters.$and = andConditions;
        }
        const assets = await Asset.find(filters)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('departmentId', 'name')
            .populate('locationId', 'name')
            .populate('parentAssetId', 'name serial');

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
        const asset = await Asset.findById(req.params.id)
            .populate('departmentId')
            .populate('locationId');
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // RBAC: Check if user can access this asset (Branch + Department)
        if (req.user && req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId?.toString() || (req.user as any).branchId;
            const assetBranchId = asset.branchId?.toString() || asset.branchId;

            // Strict branch check for all non-superuser
            if (userBranchId !== assetBranchId) {
                return res.status(403).json({ message: 'Access denied: Asset belongs to another branch' });
            }

            // Department check: system_admin bypasses, others must match department
            if (req.user.role !== 'system_admin') {
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
        const children = await Asset.find({ parentAssetId: asset._id }).select('name serial model category status slotNumber images location building locationDetail parentAssetId');

        const assetObj = asset.toJSON();
        (assetObj as any).children = children;

        res.json(assetObj);
    } catch (error) {
        next(error);
    }
};

// Helper to find building from location recursively
async function resolveBuilding(locationId: string): Promise<string | null> {
    const { Location } = await import('../models/location.model.js');
    let current = await Location.findById(locationId);
    if (!current) return null;

    // Traverse up to find top parent or location with type 'Building'
    let parent = current;
    while (parent.parentId) {
        const nextParent = await Location.findById(parent.parentId);
        if (!nextParent) break;
        parent = nextParent;
    }
    return parent.name;
}

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // RBAC: Auto-assign department for non-superuser roles
        // system_admin can create in any department in their branch
        // admin and below are restricted to their own department
        if (req.user && req.user.role !== 'superuser') {
            if (!req.body.departmentId) {
                req.body.departmentId = req.user.departmentId;
                if (!req.body.department && req.user.department) {
                    req.body.department = req.user.department;
                }
            } else if (req.user.role !== 'system_admin' && !['manager', 'technician', 'supervisor'].includes(req.user.role)) {
                // Restricted roles can only create in their own department
                if (req.body.departmentId !== req.user.departmentId) {
                    return res.status(403).json({ message: 'You can only create assets in your department' });
                }
            }
        }

        if (req.body.technicalSpecifications && typeof req.body.technicalSpecifications === 'object') {
            const sanitizeKeys = (obj: any): any => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sanitizeKeys);
                const result: any = {};
                for (const [k, v] of Object.entries(obj)) {
                    result[k.replace(/\./g, '_').replace(/^\$/, '_')] = typeof v === 'object' ? sanitizeKeys(v) : v;
                }
                return result;
            };
            req.body.technicalSpecifications = sanitizeKeys(req.body.technicalSpecifications);
        }

        const asset = new Asset({
            ...req.body,
            // Set branchId based on user role: only superuser can choose branch
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId
        });

        // Auto-assign to Warehouse if no location specified
        if (!asset.locationId) {
            const { Location } = await import('../models/location.model.js');
            let warehouse = null;

            // Try 1: Match department + branch
            if (asset.departmentId) {
                warehouse = await Location.findOne({
                    departmentId: asset.departmentId,
                    isWarehouse: true,
                    branchId: asset.branchId
                });
            }

            // Try 2: Match branch only
            if (!warehouse && asset.branchId) {
                warehouse = await Location.findOne({
                    branchId: asset.branchId,
                    isWarehouse: true
                });
            }

            // Try 3: Any warehouse
            if (!warehouse) {
                warehouse = await Location.findOne({ isWarehouse: true });
            }

            // Try 4: Match by type/name containing 'warehouse' or 'gudang'
            if (!warehouse) {
                warehouse = await Location.findOne({
                    $or: [
                        { type: { $regex: /warehouse|gudang/i } },
                        { name: { $regex: /warehouse|gudang/i } }
                    ]
                });
            }

            if (warehouse) {
                asset.locationId = warehouse._id;
                asset.location = warehouse.name;
            }
        }

        // Auto-set status based on location
        if (asset.locationId) {
            const { Location } = await import('../models/location.model.js');
            const targetLocation = await Location.findById(asset.locationId);
            if (targetLocation) {
                asset.location = targetLocation.name;
                if (!targetLocation.isWarehouse) {
                    asset.status = 'in_use';
                } else {
                    asset.status = 'storage';
                }
            }
            
            // Resolve building name
            asset.building = await resolveBuilding(asset.locationId.toString());
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
        // superuser bypasses, system_admin bypasses (they see all depts in their branch)
        if (req.user && req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
            const isDeptMatch =
                (existingAsset.departmentId && req.user.departmentId && existingAsset.departmentId.toString() === req.user.departmentId.toString()) ||
                (existingAsset.department && req.user.department && existingAsset.department === req.user.department);

            if (!isDeptMatch && !['manager', 'technician', 'supervisor'].includes(req.user.role)) {
                return res.status(403).json({ message: 'You can only update assets from your department' });
            }
            // Prevent changing department to one you don't own
            if (req.body.departmentId && req.body.departmentId !== req.user.departmentId) {
                if (req.user.departmentId) {
                    req.body.departmentId = req.user.departmentId;
                } else {
                    return res.status(403).json({ message: 'You cannot transfer assets to other departments' });
                }
            }
        }

        const updateData = { ...req.body };
        // Only superuser can change branchId
        if (req.user.role === 'superuser' && req.body.branchId) {
            updateData.branchId = req.body.branchId;
        } else {
            delete updateData.branchId;
        }

        // Sanitize technicalSpecifications keys to prevent Mongoose map dot errors
        if (updateData.technicalSpecifications && typeof updateData.technicalSpecifications === 'object') {
            const sanitizeKeys = (obj: any): any => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sanitizeKeys);
                const result: any = {};
                for (const [k, v] of Object.entries(obj)) {
                    result[k.replace(/\./g, '_').replace(/^\$/, '_')] = typeof v === 'object' ? sanitizeKeys(v) : v;
                }
                return result;
            };
            updateData.technicalSpecifications = sanitizeKeys(updateData.technicalSpecifications);
        }

        // Check if status was explicitly changed in the request
        const statusExplicitlyChanged = req.body.status !== undefined && req.body.status !== existingAsset.status;

        // Auto-update status if location is present and status is not protected
        // We PROTECT 'assigned' and 'maintenance' statuses from being overwritten by location changes
        const currentStatus = updateData.status || existingAsset.status;
        const statusProtected = ['assigned', 'maintenance', 'retired', 'disposed', 'request maintenance'].includes(currentStatus);

        let resolvedLocationId: string | null = existingAsset.locationId?.toString() || null;

        if (updateData.locationId !== undefined) {
            if (updateData.locationId === null || updateData.locationId === "null" || updateData.locationId === "") {
                // User explicitly selected Auto (Warehouse) — find best matching warehouse
                const { Location } = await import('../models/location.model.js');
                let warehouse = null;

                // Try 1: Match department + branch
                if (existingAsset.departmentId) {
                    warehouse = await Location.findOne({
                        departmentId: existingAsset.departmentId,
                        isWarehouse: true,
                        branchId: existingAsset.branchId
                    });
                }

                // Try 2: Match branch only
                if (!warehouse && existingAsset.branchId) {
                    warehouse = await Location.findOne({
                        branchId: existingAsset.branchId,
                        isWarehouse: true
                    });
                }

                // Try 3: Any warehouse
                if (!warehouse) {
                    warehouse = await Location.findOne({ isWarehouse: true });
                }

                // Try 4: Match by type/name containing 'warehouse' or 'gudang'
                if (!warehouse) {
                    warehouse = await Location.findOne({
                        $or: [
                            { type: { $regex: /warehouse|gudang/i } },
                            { name: { $regex: /warehouse|gudang/i } }
                        ]
                    });
                }

                if (warehouse) {
                    resolvedLocationId = warehouse._id.toString();
                } else {
                    resolvedLocationId = null;
                }
                updateData.locationId = resolvedLocationId;
            } else {
                resolvedLocationId = updateData.locationId;
            }
        }

        if (resolvedLocationId) {
            const { Location } = await import('../models/location.model.js');
            const targetLocation = await Location.findById(resolvedLocationId);
            if (targetLocation) {
                updateData.location = targetLocation.name;
                // Only auto-update status if it wasn't explicitly changed by user AND isn't protected
                if (!statusProtected && !statusExplicitlyChanged) {
                    if (!targetLocation.isWarehouse) {
                        updateData.status = 'in_use';
                    } else {
                        updateData.status = 'active';
                    }
                }
                
                // Resolve building name
                updateData.building = await resolveBuilding(resolvedLocationId);
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
        // superuser/system_admin bypass dept check, manager/technician/supervisor also bypass
        if (req.user && req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
            const isDeptMatch =
                (existingAsset.departmentId && req.user.departmentId && existingAsset.departmentId.toString() === req.user.departmentId.toString()) ||
                (existingAsset.department && req.user.department && existingAsset.department === req.user.department);

            if (!isDeptMatch && !['manager', 'technician', 'supervisor'].includes(req.user.role)) {
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

export const bulkDeleteAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'An array of asset IDs is required for bulk delete' });
        }

        // Fetch all assets to verify permissions
        const assetsToDelete = await Asset.find({ _id: { $in: ids } });

        if (assetsToDelete.length === 0) {
            return res.status(404).json({ message: 'No valid assets found to delete' });
        }

        const allowedDeleteIds: string[] = [];
        const auditLogEntries: any[] = [];

        for (const asset of assetsToDelete) {
            // RBAC: Check if user can delete this asset
            let canDelete = true;
            if (req.user && req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
                const isDeptMatch =
                    (asset.departmentId && req.user.departmentId && asset.departmentId.toString() === req.user.departmentId.toString()) ||
                    (asset.department && req.user.department && asset.department === req.user.department);

                if (!isDeptMatch && !['manager', 'technician', 'supervisor'].includes(req.user.role)) {
                    canDelete = false;
                }
            }

            if (canDelete) {
                allowedDeleteIds.push(asset._id.toString());
                auditLogEntries.push({
                    userId: req.user._id,
                    action: 'delete',
                    resourceType: 'Asset',
                    resourceId: asset._id.toString(),
                    resourceName: asset.name,
                    details: `Bulk deleted asset: ${asset.name} (${asset.serial})`,
                    branchId: (req.user as any).branchId?.toString(),
                    departmentId: asset.departmentId?.toString()
                });
            }
        }

        if (allowedDeleteIds.length === 0) {
            return res.status(403).json({ message: 'You do not have permission to delete any of the selected assets' });
        }

        // Perform deletion
        await Asset.deleteMany({ _id: { $in: allowedDeleteIds } });

        // Record Audit Logs
        for (const logEntry of auditLogEntries) {
            await recordAuditLog(logEntry);
        }

        res.json({
            message: `Successfully deleted ${allowedDeleteIds.length} assets`,
            deletedCount: allowedDeleteIds.length,
            rejectedCount: ids.length - allowedDeleteIds.length
        });
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

        // RBAC: Filter stats by department for non-privileged users
        // system_admin sees all departments, others are restricted
        if (req.user && req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
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
            if (req.user.role !== 'system_admin') {
                if (req.user.departmentId) {
                    query.departmentId = req.user.departmentId;
                } else if (departmentId) {
                    query.departmentId = departmentId;
                }
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
        const slotDetail = slotNumber !== undefined ? ` at Slot ${slotNumber}` : '';
        asset.activityLog.push({
            action: 'installed',
            details: `Installed in ${parentName}${slotDetail}`,
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
            details: `Installed asset in ${parentName}${slotDetail}`,
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
        asset.status = 'storage'; // Auto-update status to Storage / Warehouse

        // Find Department Warehouse to move asset back to
        {
            const { Location } = await import('../models/location.model.js');
            let warehouse = null;

            // Try 1: Match department + branch
            if (asset.departmentId) {
                warehouse = await Location.findOne({
                    departmentId: asset.departmentId,
                    isWarehouse: true,
                    branchId: asset.branchId
                });
            }

            // Try 2: Match branch only
            if (!warehouse && asset.branchId) {
                warehouse = await Location.findOne({
                    branchId: asset.branchId,
                    isWarehouse: true
                });
            }

            // Try 3: Any warehouse
            if (!warehouse) {
                warehouse = await Location.findOne({ isWarehouse: true });
            }

            // Try 4: Match by type/name
            if (!warehouse) {
                warehouse = await Location.findOne({
                    $or: [
                        { type: { $regex: /warehouse|gudang/i } },
                        { name: { $regex: /warehouse|gudang/i } }
                    ]
                });
            }

            if (warehouse) {
                asset.locationId = warehouse._id;
                asset.location = warehouse.name;
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
