import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';

export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const filters: any = {};

        // RBAC / Department Filtering
        // req.user is populated by authMiddleware
        if (req.user && req.user.role !== 'superuser' && req.user.role !== 'admin') {
            if (req.user.departmentId) {
                filters.departmentId = req.user.departmentId;
            } else {
                // If user has no department assigned, they shouldn't see assets restricted to departments
                // Or maybe they see assets with NO department? 
                // For now, let's strictly restrict if they have no department.
                // But to be safe, maybe we return nothing or just generic ones?
                // Plan said: "Strictly filtered by departmentId".
                // So if no departmentId, we can't filter by it.
                // Let's assume for now they see nothing if they are not admin/superuser and have no department.
                filters.departmentId = "non-existent-id"; // Hack to return empty
            }
        }

        if (req.query.category) filters.category = req.query.category;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.locationId) filters.locationId = req.query.locationId;
        if (req.query.search) {
            filters.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { serial: { $regex: req.query.search, $options: 'i' } }
            ];
        }

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
