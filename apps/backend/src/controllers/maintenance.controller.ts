import { Request, Response, NextFunction } from 'express';
import { MaintenanceRecord } from '../models/maintenance.model.js';

export const getMaintenanceRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};
        if (req.query.serviceProviderType) {
            filter.serviceProviderType = req.query.serviceProviderType;
        }
        if (req.query.asset) {
            filter.asset = req.query.asset;
        }

        const records = await MaintenanceRecord.find(filter)
            .populate('asset', 'name serial')
            .populate('technician', 'name avatar')
            .populate('vendor', 'name')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

import { Asset } from '../models/asset.model.js';

export const createMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.technician === '') delete req.body.technician;
        if (req.body.vendor === '') delete req.body.vendor;

        const record = new MaintenanceRecord(req.body);
        await record.save();

        if (req.body.asset) {
            await Asset.findByIdAndUpdate(req.body.asset, { status: 'request maintenance' });
        }

        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
};

export const updateMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json(record);
    } catch (error) {
        next(error);
    }
};

export const getMaintenanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeRepairs = await MaintenanceRecord.countDocuments({ status: 'In Progress' });
        const pending = await MaintenanceRecord.countDocuments({ status: 'Pending' });
        const completed = await MaintenanceRecord.countDocuments({ status: 'Done' });

        res.json({
            activeRepairs,
            pending,
            completed
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        next(error);
    }
};
