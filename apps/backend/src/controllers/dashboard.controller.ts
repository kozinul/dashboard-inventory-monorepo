import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import Rental from '../models/rental.model.js';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branchId = req.query.branchId as string;
        const branchFilter: any = {};

        // Apply branch scoping based on role and query
        if (req.user.role !== 'superuser') {
            branchFilter.branchId = (req.user as any).branchId;
        } else if (branchId && branchId !== 'ALL') {
            branchFilter.branchId = branchId;
        }

        // Apply department scoping for non-admin/superuser
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                branchFilter.departmentId = req.user.departmentId;
            } else if (req.user.department) {
                branchFilter.department = req.user.department;
            }
        }

        const [
            activeAssets,
            rentalAssets,
            activeTickets,
            outsideService
        ] = await Promise.all([
            Asset.countDocuments({ ...branchFilter, status: 'active' }),
            Rental.countDocuments({ ...branchFilter, status: { $in: ['active', 'overdue'] } }),
            MaintenanceRecord.countDocuments({
                ...branchFilter,
                status: { $nin: ['Closed', 'Done', 'Cancelled', 'Rejected'] }
            }),
            MaintenanceRecord.countDocuments({
                ...branchFilter,
                status: 'External Service'
            })
        ]);

        res.json({
            activeAssets,
            rentalAssets,
            activeTickets,
            outsideService
        });
    } catch (error) {
        next(error);
    }
};

export const getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch recent tickets excluding Closed and Done status
        const recentMaintenance = await MaintenanceRecord.find({
            status: { $nin: ['Closed', 'Done'] }
        })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name');

        res.json(recentMaintenance);
    } catch (error) {
        next(error);
    }
};
