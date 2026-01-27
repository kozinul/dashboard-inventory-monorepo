import { Request, Response, NextFunction } from 'express';
import { DisposalRecord } from '../models/disposal.model.js';

export const getDisposalRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const records = await DisposalRecord.find()
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
        const record = new DisposalRecord(req.body);
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
