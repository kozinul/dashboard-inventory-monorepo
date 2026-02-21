import { Request, Response, NextFunction } from 'express';
import { DisposalRecord } from '../models/disposal.model.js';

export const getDisposalRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};

        if (req.user.role !== 'superuser') {
            filter.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        // DEPT FILTERING: Only show disposal for assets in same department for non-auditors/admins
        if (req.user && !['superuser', 'system_admin', 'admin', 'auditor'].includes(req.user.role)) {
            const { Asset } = await import('../models/asset.model.js');
            const deptIds: any[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId);
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments);
            }
            const deptAssets = await Asset.find({
                departmentId: { $in: deptIds },
                branchId: (req.user as any).branchId
            }).select('_id');
            const assetIds = deptAssets.map(a => a._id);
            filter.asset = { $in: assetIds };
        }

        const records = await DisposalRecord.find(filter)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name')
            .populate('managerApproval.approvedBy', 'name')
            .populate('auditorApproval.approvedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

export const createDisposalRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = new DisposalRecord({
            ...req.body,
            requestedBy: (req.user as any)._id,
            status: 'Pending Manager Approval',
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId
        });
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
};

export const approveDisposal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { approved, comment } = req.body;
        const user = req.user as any;

        const record = await DisposalRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        if (!approved) {
            record.status = 'Rejected';
            await record.save();
            return res.json(record);
        }

        // Superuser/Admin can bypass everything
        if (user.role === 'superuser' || user.role === 'system_admin') {
            record.status = 'Approved';
            record.managerApproval = { approvedBy: user._id, approvedAt: new Date(), comment: comment || 'Approved by system administrator' };
            record.auditorApproval = { approvedBy: user._id, approvedAt: new Date(), comment: comment || 'Final approval by system administrator' };

            // Update Asset status
            const { Asset } = await import('../models/asset.model.js');
            await Asset.findByIdAndUpdate(record.asset, { status: 'disposed' });

            await record.save();
            return res.json(record);
        }

        if (record.status === 'Pending Manager Approval') {
            if (user.role !== 'manager') {
                return res.status(403).json({ message: 'Only managers can perform this step' });
            }
            record.managerApproval = { approvedBy: user._id, approvedAt: new Date(), comment };
            record.status = 'Pending Auditor Approval';
        } else if (record.status === 'Pending Auditor Approval') {
            if (user.role !== 'auditor') {
                return res.status(403).json({ message: 'Only auditors can perform this step' });
            }
            record.auditorApproval = { approvedBy: user._id, approvedAt: new Date(), comment };
            record.status = 'Approved';

            // Update Asset status
            const { Asset } = await import('../models/asset.model.js');
            await Asset.findByIdAndUpdate(record.asset, { status: 'disposed' });
        }

        await record.save();
        res.json(record);
    } catch (error) {
        next(error);
    }
};

export const getDisposalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};
        if (req.user.role !== 'superuser') {
            filter.branchId = (req.user as any).branchId;
        }

        // DEPT FILTERING for stats
        if (req.user && !['superuser', 'system_admin', 'admin', 'auditor'].includes(req.user.role)) {
            const { Asset } = await import('../models/asset.model.js');
            const deptIds: any[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId);
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments);
            }
            const deptAssets = await Asset.find({
                departmentId: { $in: deptIds },
                branchId: (req.user as any).branchId
            }).select('_id');
            const assetIds = deptAssets.map(a => a._id);
            filter.asset = { $in: assetIds };
        }

        const pendingManager = await DisposalRecord.countDocuments({ ...filter, status: 'Pending Manager Approval' });
        const pendingAuditor = await DisposalRecord.countDocuments({ ...filter, status: 'Pending Auditor Approval' });
        const approved = await DisposalRecord.countDocuments({ ...filter, status: 'Approved' });
        const rejected = await DisposalRecord.countDocuments({ ...filter, status: 'Rejected' });

        res.json({
            pendingManager,
            pendingAuditor,
            approved,
            rejected
        });
    } catch (error) {
        next(error);
    }
};
