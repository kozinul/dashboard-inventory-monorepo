import { Request, Response, NextFunction } from 'express';
import { Unit } from '../models/unit.model.js';

export const createUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Set branchId based on user role
        const branchId = req.user.role === 'superuser'
            ? (req.body.branchId || (req.user as any).branchId)
            : (req.user as any).branchId;

        const unit = new Unit({
            ...req.body,
            branchId
        });
        await unit.save();
        res.status(201).json(unit);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Unit symbol must be unique' });
        }
        next(error);
    }
};

export const getAllUnits = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Build filter based on user role and branch
        const filter: any = {};

        if (req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId;
            if (userBranchId) {
                filter.$or = [
                    { branchId: userBranchId },
                    { branchId: null },
                    { branchId: { $exists: false } }
                ];
            } else {
                filter.$or = [
                    { branchId: null },
                    { branchId: { $exists: false } }
                ];
            }
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        const units = await Unit.find(filter).sort({ name: 1 });
        res.json(units);
    } catch (error: any) {
        next(error);
    }
};

export const getUnitById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }
        res.json(unit);
    } catch (error: any) {
        next(error);
    }
};

export const updateUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateData = { ...req.body };

        // Superusers can change branchId if provided
        if (req.user.role === 'superuser' && req.body.branchId) {
            updateData.branchId = req.body.branchId;
        } else {
            // Non-superusers cannot change branchId
            delete updateData.branchId;
        }

        const unit = await Unit.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }
        res.json(unit);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Unit symbol must be unique' });
        }
        next(error);
    }
};

export const deleteUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unit = await Unit.findByIdAndDelete(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }
        res.json({ message: 'Unit deleted successfully' });
    } catch (error: any) {
        next(error);
    }
};
