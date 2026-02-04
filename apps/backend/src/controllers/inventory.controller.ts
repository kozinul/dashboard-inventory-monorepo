import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import Event from '../models/event.model.js';

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.header('Cache-Control', 'no-store');
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filters: any = {};
        const andConditions: any[] = [];

        // RBAC / Department Filtering
        // req.user is populated by authMiddleware
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            console.log('DEBUG FILTER: User:', req.user.username, 'Role:', req.user.role, 'DeptID:', req.user.departmentId);
            const deptConditions = [];

            if (req.user.departmentId) {
                deptConditions.push({ departmentId: req.user.departmentId });
            }
            // Fallback to string match if department ID is verified but data might be legacy
            if (req.user.department) {
                deptConditions.push({ department: req.user.department });
            }

            if (deptConditions.length > 0) {
                andConditions.push({ $or: deptConditions });
            } else {
                // User has no department assigned, explicit deny for assets
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
        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = new Asset(req.body);
        await asset.save();
        res.status(201).json(asset);
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(asset);
    } catch (error) {
        next(error);
    }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await Asset.findByIdAndDelete(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const getInventoryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalAssets = await Asset.countDocuments();
        const totalValueAgg = await Asset.aggregate([
            { $group: { _id: null, total: { $sum: '$value' } } }
        ]);
        const lowStock = await Asset.countDocuments({ status: 'active' }); // Simplification for demo
        const maintenanceCount = await Asset.countDocuments({ status: 'maintenance' });

        res.json({
            totalAssets,
            totalValue: totalValueAgg[0]?.total || 0,
            lowStock, // Placeholder logic
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
