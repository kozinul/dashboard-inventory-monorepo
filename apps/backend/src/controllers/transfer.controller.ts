import { Request, Response, NextFunction } from 'express';
import { Transfer } from '../models/transfer.model.js';
import { Asset } from '../models/asset.model.js';

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId, toDepartmentId, notes } = req.body;

        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Check if user has permission to transfer (must be in the department of the asset or admin)
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (asset.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'You can only transfer assets from your own department' });
            }
        }

        const transfer = new Transfer({
            assetId,
            fromDepartmentId: asset.departmentId,
            toDepartmentId,
            requestedBy: req.user?._id,
            notes,
            status: 'Pending'
        });

        await transfer.save();

        // Optionally update asset status to indicate it's in transfer
        // asset.status = 'transferring'; // If we add this status to Asset enum
        // await asset.save();

        res.status(201).json(transfer);
    } catch (error) {
        next(error);
    }
};

export const getTransfers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters: any = {};

        // RBAC: Non-admin users only see transfers involving their department
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            filters.$or = [
                { fromDepartmentId: req.user.departmentId },
                { toDepartmentId: req.user.departmentId }
            ];
        }

        const transfers = await Transfer.find(filters)
            .populate('assetId')
            .populate('fromDepartmentId')
            .populate('toDepartmentId')
            .populate('requestedBy', 'name username')
            .populate('approvedBy', 'name username')
            .sort({ createdAt: -1 });

        res.json(transfers);
    } catch (error) {
        next(error);
    }
};

export const approveTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending transfers can be approved' });
        }

        // RBAC: Only admin or user from the target department can approve
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.toDepartmentId.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving department (or admins) can approve transfers' });
            }
        }

        transfer.status = 'Approved';
        transfer.approvedBy = req.user?._id;
        transfer.completedAt = new Date();
        await transfer.save();

        // Update the asset
        const asset = await Asset.findById(transfer.assetId);
        if (asset) {
            asset.departmentId = transfer.toDepartmentId;
            // Also update the department string name if it exists (legacy support)
            // We'll need to populate the department name from the model
            const TransferWithDept = await Transfer.findById(transfer._id).populate('toDepartmentId');
            if (TransferWithDept?.toDepartmentId && (TransferWithDept.toDepartmentId as any).name) {
                asset.department = (TransferWithDept.toDepartmentId as any).name;
            }

            await asset.save();
        }

        res.json(transfer);
    } catch (error) {
        next(error);
    }
};

export const rejectTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending transfers can be rejected' });
        }

        // RBAC: Only admin or user from the target department can reject
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.toDepartmentId.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving department (or admins) can reject transfers' });
            }
        }

        transfer.status = 'Rejected';
        transfer.approvedBy = req.user?._id;
        transfer.completedAt = new Date();
        await transfer.save();

        res.json(transfer);
    } catch (error) {
        next(error);
    }
};
