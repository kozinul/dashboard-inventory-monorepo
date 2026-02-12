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

        const records = await DisposalRecord.find(filter)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name')
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
            // Set branchId based on user role
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

export const updateDisposalStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await DisposalRecord.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json(record);
    } catch (error) {
        next(error);
    }
};

export const getDisposalStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pending = await DisposalRecord.countDocuments({ status: { $regex: 'Pending', $options: 'i' } });
        const decommissioned = await DisposalRecord.countDocuments({ status: 'Disposed' });
        const complianceIssues = await DisposalRecord.countDocuments({ status: 'Compliance Check' });

        // Placeholder for value recovered (would need to track this field)
        const valueRecovered = 12450;

        res.json({
            pending,
            decommissioned,
            valueRecovered,
            complianceIssues
        });
    } catch (error) {
        next(error);
    }
};
