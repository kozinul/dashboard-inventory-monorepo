import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import Rental from '../models/rental.model.js';
import { Supply } from '../models/supply.model.js';

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

        const isPowerUser = ['superuser', 'admin'].includes(req.user.role);
        const deptId = req.user.departmentId;

        // Assets filter (Asset model has departmentId)
        const assetFilter: any = { ...branchFilter };
        if (!isPowerUser && deptId) {
            assetFilter.departmentId = deptId;
        }

        // Resolve Asset IDs for the department to filter other collections
        let deptAssetIds: any[] = [];
        if (!isPowerUser && deptId) {
            const deptAssets = await Asset.find(assetFilter).select('_id');
            deptAssetIds = deptAssets.map(a => a._id);
        }

        // Rental filter (Rental model does NOT have departmentId)
        const rentalFilter: any = { ...branchFilter };
        if (!isPowerUser && deptId) {
            rentalFilter.assetId = { $in: deptAssetIds };
        }

        // Maintenance filter (MaintenanceRecord model does NOT have departmentId)
        const maintenanceFilter: any = { ...branchFilter };
        if (!isPowerUser && deptId) {
            if (req.user.role === 'user') {
                // Users see strictly THEIR requested tickets for THEIR department assets
                maintenanceFilter.$and = [
                    { asset: { $in: deptAssetIds } },
                    { requestedBy: req.user._id }
                ];
            } else {
                // Managers see all tickets for their department assets
                maintenanceFilter.asset = { $in: deptAssetIds };
            }
        } else if (!isPowerUser && req.user.role === 'user') {
            maintenanceFilter.requestedBy = req.user._id;
        }

        const [
            activeAssets,
            rentalAssets,
            activeTickets,
            outsideService
        ] = await Promise.all([
            Asset.countDocuments({ ...assetFilter, status: 'active' }),
            Rental.countDocuments({ ...rentalFilter, status: { $in: ['active', 'overdue'] } }),
            MaintenanceRecord.countDocuments({
                ...maintenanceFilter,
                status: { $nin: ['Closed', 'Done', 'Cancelled', 'Rejected'] }
            }),
            MaintenanceRecord.countDocuments({
                ...maintenanceFilter,
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
        const branchId = req.query.branchId as string;
        const branchFilter: any = {};

        // Apply branch scoping based on role and query
        if (req.user.role !== 'superuser') {
            branchFilter.branchId = (req.user as any).branchId;
        } else if (branchId && branchId !== 'ALL') {
            branchFilter.branchId = branchId;
        }

        const isPowerUser = ['superuser', 'admin'].includes(req.user.role);
        const deptId = req.user.departmentId;

        // Fetch asset IDs for the department to filter maintenance records
        let deptAssetIds: any[] = [];
        if (!isPowerUser && deptId) {
            const deptAssets = await Asset.find({ ...branchFilter, departmentId: deptId }).select('_id');
            deptAssetIds = deptAssets.map(a => a._id);
        }

        // Maintenance filter
        const maintenanceFilter: any = { ...branchFilter };
        if (!isPowerUser && deptId) {
            if (req.user.role === 'user') {
                maintenanceFilter.$and = [
                    { asset: { $in: deptAssetIds } },
                    { requestedBy: req.user._id }
                ];
            } else {
                maintenanceFilter.asset = { $in: deptAssetIds };
            }
        } else if (!isPowerUser && req.user.role === 'user') {
            maintenanceFilter.requestedBy = req.user._id;
        }

        // Fetch recent tickets excluding Closed and Done status
        const recentMaintenance = await MaintenanceRecord.find({
            ...maintenanceFilter,
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

export const getLowStockSupplies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branchId = req.query.branchId as string;
        const branchFilter: any = {};

        // Apply branch scoping based on role and query
        if (req.user.role !== 'superuser') {
            branchFilter.branchId = (req.user as any).branchId;
        } else if (branchId && branchId !== 'ALL') {
            branchFilter.branchId = branchId;
        }

        const isPowerUser = ['superuser', 'admin'].includes(req.user.role);
        const deptId = req.user.departmentId;

        // Apply department scoping for non-admin/superuser
        if (!isPowerUser && deptId) {
            branchFilter.departmentId = deptId;
        }

        // Fetch supplies where quantity <= minimumStock
        const lowStockSupplies = await Supply.find({
            ...branchFilter,
            $expr: { $lte: ['$quantity', '$minimumStock'] }
        })
            .sort({ quantity: 1 }) // Show out of stock first
            .limit(10)
            .populate('locationId', 'name')
            .populate('unitId', 'name');

        res.json(lowStockSupplies);
    } catch (error) {
        next(error);
    }
};
