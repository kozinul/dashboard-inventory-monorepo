import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { DisposalRecord } from '../models/disposal.model.js';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const [
            totalAssets,
            totalValueAgg,
            activeRepairs,
            pendingDisposal
        ] = await Promise.all([
            Asset.countDocuments(),
            Asset.aggregate([{ $group: { _id: null, total: { $sum: '$value' } } }]),
            MaintenanceRecord.countDocuments({ status: 'In Progress' }),
            DisposalRecord.countDocuments({ status: 'Pending Approval' })
        ]);

        res.json({
            totalAssets,
            totalValue: totalValueAgg[0]?.total || 0,
            activeRepairs,
            pendingDisposal
        });
    } catch (error) {
        next(error);
    }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch recent items from multiple collections and merge (simplified)
        const recentMaintenance = await MaintenanceRecord.find()
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('asset', 'name')
            .populate('technician', 'name');

        res.json(recentMaintenance);
    } catch (error) {
        next(error);
    }
};
