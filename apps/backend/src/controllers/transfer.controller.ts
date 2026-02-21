import { Request, Response, NextFunction } from 'express';
import { Transfer } from '../models/transfer.model.js';
import { Asset } from '../models/asset.model.js';

import { Branch } from '../models/branch.model.js'; // Import Branch model

export const updateTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { toDepartmentId, toBranchId, notes } = req.body;
        const transfer = await Transfer.findById(req.params.id);

        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending transfers can be updated' });
        }

        // RBAC: Only admin or the requester can update
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.requestedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only update your own transfer requests' });
            }
        }

        transfer.toDepartmentId = toDepartmentId;
        transfer.toBranchId = toBranchId;
        transfer.notes = notes;

        await transfer.save();
        res.json(transfer);
    } catch (error) {
        next(error);
    }
};

export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId, toDepartmentId, toBranchId, notes } = req.body;

        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Default to current branch if not specified (Intra-branch transfer)
        // If asset has no branchId (legacy data), assume user's branch or fallback to Head Office
        let originBranchId = asset.branchId || req.user.branchId;

        // Fallback: If no branch found, try to find "Head Office" or any branch
        if (!originBranchId) {
            const hoBranch = await Branch.findOne({ isHeadOffice: true });
            const anyBranch = await Branch.findOne(); // Fallback to ANY branch if no HO
            originBranchId = hoBranch?._id || anyBranch?._id;

            // If still no branch, we can't process this request safely if strict mode is on.
            // But let's assume one exists or we just create without it if validation allows (but we set required: true)
            if (!originBranchId) {
                return res.status(500).json({ message: 'System Configuration Error: No branches defined. Please contact admin.' });
            }
        }

        // If no target branch specified, it's intra-branch (same branch)
        const targetBranchId = toBranchId || originBranchId;

        // Check permission: User must be in origin branch/dept or admin
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            // Check Department ownership
            if (asset.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'You can only transfer assets from your own department' });
            }
            // Check Branch ownership (if user has branch assigned)
            if (req.user.branchId && originBranchId && req.user.branchId.toString() !== originBranchId.toString()) {
                // If the user has no branch (legacy), we might skip this check or strictly enforce it.
                // For now, let's allow it if user has NO branch, assuming they are legacy admin/user.
                return res.status(403).json({ message: 'You can only transfer assets from your own branch' });
            }
        }

        const transfer = new Transfer({
            assetId,
            fromDepartmentId: asset.departmentId,
            toDepartmentId,
            fromBranchId: originBranchId,
            toBranchId: targetBranchId,
            requestedBy: req.user?._id,
            notes,
            status: 'Pending'
        });

        await transfer.save();

        res.status(201).json(transfer);
    } catch (error) {
        next(error);
    }
};

export const getTransfers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters: any = {};

        // RBAC: Non-admin users only see transfers involving their department/branch
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const deptIds: any[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId);
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments);
            }
            const myBranch = req.user.branchId;

            if (deptIds.length > 0 && myBranch) {
                filters.$or = [
                    { requestedBy: req.user._id },
                    { fromDepartmentId: { $in: deptIds }, fromBranchId: myBranch },
                    { toDepartmentId: { $in: deptIds }, toBranchId: myBranch }
                ];
            } else if (deptIds.length > 0) {
                filters.$or = [
                    { requestedBy: req.user._id },
                    { fromDepartmentId: { $in: deptIds } },
                    { toDepartmentId: { $in: deptIds } }
                ];
            } else {
                filters.requestedBy = req.user._id;
            }
        }

        const transfers = await Transfer.find(filters)
            .populate('assetId')
            .populate('fromDepartmentId')
            .populate('toDepartmentId')
            .populate('fromBranchId')
            .populate('toBranchId')
            .populate('requestedBy', 'name username')
            .populate('approvedBy', 'name username')
            .populate('managerApprovedBy', 'name username')
            .sort({ createdAt: -1 });

        res.json(transfers);
    } catch (error) {
        next(error);
    }
};

// Receiver Approves (Final Step: InTransit -> Completed)
export const approveTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'InTransit') {
            return res.status(400).json({ message: 'Only transfers in transit can be completed (received)' });
        }

        // RBAC: Only admin or user from the target department AND target branch can approve
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.toDepartmentId.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving department can receive transfers' });
            }
            if (transfer.toBranchId && req.user.branchId && transfer.toBranchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving branch can receive transfers' });
            }
        }

        transfer.status = 'Completed';
        transfer.approvedBy = req.user?._id;
        transfer.completedAt = new Date();
        await transfer.save();

        // Update the asset
        const asset = await Asset.findById(transfer.assetId);
        if (asset) {
            asset.departmentId = transfer.toDepartmentId;
            asset.branchId = transfer.toBranchId; // Update Branch Location

            // Also update the department string name if it exists (legacy support)
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

// Requester Sends (Step 1: Pending -> WaitingApproval)
export const sendTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending transfers can be sent for approval' });
        }

        // RBAC: Only admin or the requester can send
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.requestedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only send your own transfer requests' });
            }
        }

        transfer.status = 'WaitingApproval';
        await transfer.save();

        res.json(transfer);
    } catch (error) {
        next(error);
    }
};

// Manager Approves (Step 2: WaitingApproval -> InTransit)
export const approveTransferByManager = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'WaitingApproval') {
            return res.status(400).json({ message: 'Only transfers waiting for manager approval can be approved by manager' });
        }

        // RBAC: Only admin or Manager from the source department AND source branch can approve
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            // Check if user has manager role
            if (!['manager'].includes(req.user.role)) {
                return res.status(403).json({ message: 'Only managers can approve transfer requests' });
            }

            if (transfer.fromDepartmentId.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'You can only approve transfers from your own department' });
            }
            if (transfer.fromBranchId && req.user.branchId && transfer.fromBranchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ message: 'You can only approve transfers from your own branch' });
            }
        }

        transfer.status = 'InTransit';
        transfer.managerApprovedBy = req.user?._id;
        transfer.managerApprovedAt = new Date();
        await transfer.save();

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

        if (!['Pending', 'WaitingApproval'].includes(transfer.status)) { // Can reject in early stages
            return res.status(400).json({ message: 'Only pending or waiting approval transfers can be rejected' });
        }

        // RBAC: Only admin or user from the target department can reject
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.toDepartmentId.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving department (or admins) can reject transfers' });
            }
            if (transfer.toBranchId && req.user.branchId && transfer.toBranchId.toString() !== req.user.branchId.toString()) {
                return res.status(403).json({ message: 'Only users from the receiving branch can reject transfers' });
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

export const deleteTransfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer request not found' });
        }

        if (transfer.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending transfers can be deleted' });
        }

        // RBAC: Only admin or the requester can delete
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (transfer.requestedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'You can only delete your own transfer requests' });
            }
        }

        await transfer.deleteOne();
        res.json({ message: 'Transfer request deleted successfully' });
    } catch (error) {
        next(error);
    }
};
