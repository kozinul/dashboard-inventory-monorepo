import { Asset } from '../models/asset.model.js';
import Event from '../models/event.model.js';
import { Assignment } from '../models/assignment.model.js';

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.header('Cache-Control', 'no-store');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filters: any = {};
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
        if (req.query.status) filters.status = req.query.status;
        if (req.query.locationId) filters.locationId = req.query.locationId;

        // RBAC / Department Filtering
        // req.user is populated by authMiddleware
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const accessConditions: any[] = [];
            const userBranchId = (req.user as any).branchId;

            // 1. Department Access (Scoped to User's Branch)
            // 1. Department Access (Scoped to User's Branch)
            // Users can only see department assets IN THEIR BRANCH
            // Nuance: Only the 'user' role should have assigned assets hidden.
            // Managers and Technicians should see them for management/repairs.
            const shouldHideAssigned = req.user.role === 'user';
            const deptFilter: any = { branchId: userBranchId };
            if (shouldHideAssigned) {
                deptFilter.status = { $ne: 'assigned' };
            }

            if (req.user.departmentId) {
                accessConditions.push({
                    ...deptFilter,
                    departmentId: req.user.departmentId
                });
            } else if (req.user.department) {
                accessConditions.push({
                    ...deptFilter,
                    department: req.user.department
                });
            }

            if (accessConditions.length > 0) {
                andConditions.push({ $or: accessConditions });
            } else {
                // No department -> see nothing
                return res.json({
                    data: [],
                    pagination: {
                        page,
                        limit,
                        total: 0,
                        pages: 0
                    }
                });
            }
        } else if (req.user.role === 'admin') {
            // Admins are restricted to their branch for ALL assets
            filters.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filters.branchId = req.query.branchId;
        }

        if (req.query.category) filters.category = req.query.category;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.locationId) filters.locationId = req.query.locationId;

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
            .limit(limit);

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

        // RBAC: Check if user can access this asset
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const isDeptMatch =
                (asset.departmentId && req.user.departmentId && asset.departmentId.toString() === req.user.departmentId.toString()) ||
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

        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // RBAC: Non-admin users can only create assets in their department
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
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
        await asset.save();
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
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
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

        const asset = await Asset.findByIdAndUpdate(req.params.id, updateData, { new: true });
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
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const isDeptMatch =
                (existingAsset.departmentId && req.user.departmentId && existingAsset.departmentId.toString() === req.user.departmentId.toString()) ||
                (existingAsset.department && req.user.department && existingAsset.department === req.user.department);

            if (!isDeptMatch) {
                return res.status(403).json({ message: 'You can only delete assets from your department' });
            }
        }

        await Asset.findByIdAndDelete(req.params.id);
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
        if (req.user.role !== 'superuser') {
            filter.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        let assetIds: any[] = [];

        // RBAC: Filter stats by department for non-admin users
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                filter.departmentId = req.user.departmentId;
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
        const { startTime, endTime, excludeEventId } = req.query;

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
        const assets = await Asset.find({
            _id: { $nin: bookedAssetIds },
            status: { $ne: 'disposed' },
            'rentalRates.0': { $exists: true }
        });

        res.json(assets);

    } catch (error) {
        next(error);
    }
};
