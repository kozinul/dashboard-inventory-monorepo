import { Request, Response, NextFunction } from 'express';
import { Department } from '../models/department.model.js';

export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        next(error);
    }
};

export const createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, code, status } = req.body;

        const existingDepartment = await Department.findOne({ $or: [{ name }, { code }] });
        if (existingDepartment) {
            res.status(400);
            throw new Error('Department with this name or code already exists');
        }

        const department = await Department.create({ name, code, status });
        res.status(201).json(department);
    } catch (error) {
        next(error);
    }
};

export const updateDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const department = await Department.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!department) {
            res.status(404);
            throw new Error('Department not found');
        }

        res.json(department);
    } catch (error) {
        next(error);
    }
};

export const deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id);

        if (!department) {
            res.status(404);
            throw new Error('Department not found');
        }

        await department.deleteOne();
        res.json({ message: 'Department removed' });
    } catch (error) {
        next(error);
    }
};
