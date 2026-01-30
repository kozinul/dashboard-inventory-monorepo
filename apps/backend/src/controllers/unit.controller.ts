import { Request, Response } from 'express';
import { Unit } from '../models/unit.model.js';

export const createUnit = async (req: Request, res: Response) => {
    try {
        const unit = new Unit(req.body);
        await unit.save();
        res.status(201).json(unit);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Unit symbol must be unique' });
        }
        res.status(400).json({ message: error.message });
    }
};

export const getAllUnits = async (req: Request, res: Response) => {
    try {
        const units = await Unit.find().sort({ name: 1 });
        res.json(units);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getUnitById = async (req: Request, res: Response) => {
    try {
        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }
        res.json(unit);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUnit = async (req: Request, res: Response) => {
    try {
        const unit = await Unit.findByIdAndUpdate(
            req.params.id,
            req.body,
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
        res.status(400).json({ message: error.message });
    }
};

export const deleteUnit = async (req: Request, res: Response) => {
    try {
        const unit = await Unit.findByIdAndDelete(req.params.id);
        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }
        res.json({ message: 'Unit deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
