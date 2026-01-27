import { Request, Response, NextFunction } from 'express';
import { JobTitle } from '../models/jobTitle.model.js';

export const getJobTitles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobTitles = await JobTitle.find().populate('departmentId', 'name').sort({ title: 1 });
        res.json(jobTitles);
    } catch (error) {
        next(error);
    }
};

export const createJobTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, departmentId, status } = req.body;

        const existingJobTitle = await JobTitle.findOne({ title });
        if (existingJobTitle) {
            res.status(400);
            throw new Error('Job Title already exists');
        }

        const jobTitle = await JobTitle.create({ title, departmentId, status });
        res.status(201).json(jobTitle);
    } catch (error) {
        next(error);
    }
};

export const updateJobTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const jobTitle = await JobTitle.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate('departmentId', 'name');

        if (!jobTitle) {
            res.status(404);
            throw new Error('Job Title not found');
        }

        res.json(jobTitle);
    } catch (error) {
        next(error);
    }
};

export const deleteJobTitle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const jobTitle = await JobTitle.findById(id);

        if (!jobTitle) {
            res.status(404);
            throw new Error('Job Title not found');
        }

        await jobTitle.deleteOne();
        res.json({ message: 'Job Title removed' });
    } catch (error) {
        next(error);
    }
};
