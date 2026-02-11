import { Request, Response, NextFunction } from 'express';
import { Branch } from '../models/branch.model.js';

export const getBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branches = await Branch.find().sort({ name: 1 });
        res.json(branches);
    } catch (error) {
        next(error);
    }
};

export const createBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branch = new Branch(req.body);
        await branch.save();
        res.status(201).json(branch);
    } catch (error) {
        next(error);
    }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        res.json(branch);
    } catch (error) {
        next(error);
    }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branch = await Branch.findByIdAndDelete(req.params.id);
        if (!branch) {
            return res.status(404).json({ message: 'Branch not found' });
        }
        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        next(error);
    }
};
