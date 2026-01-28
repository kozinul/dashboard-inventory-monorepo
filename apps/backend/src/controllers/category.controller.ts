import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/category.model.js';
import { Department } from '../models/department.model.js';

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await Category.find()
            .populate('authorizedDepartments', 'name code')
            .sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, code, authorizedDepartments, description, icon } = req.body;

        // Check for duplicates
        // If code is provided and not empty, check both name and code
        // If code is empty, only check name
        const query: any = { name };
        if (code) {
            query['$or'] = [{ name }, { code }];
        }

        const existingCategory = await Category.findOne(code ? { $or: [{ name }, { code }] } : { name });
        if (existingCategory) {
            res.status(400);
            throw new Error('Category with this name or code already exists');
        }

        const categoryData = {
            name,
            authorizedDepartments,
            description,
            icon,
            ...(code && { code }) // Only include code if it's truthy
        };

        const category = await Category.create(categoryData);

        const populatedCategory = await category.populate('authorizedDepartments', 'name code');

        res.status(201).json(populatedCategory);
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { code, ...otherData } = req.body;

        // Clean up data
        const updateData: any = { ...otherData };
        if (code) {
            updateData.code = code;
        } else {
            // If code is empty string, we might want to unset it
            updateData.$unset = { code: 1 };
        }

        const category = await Category.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('authorizedDepartments', 'name code');

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        res.json(category);
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        await category.deleteOne();
        res.json({ message: 'Category removed' });
    } catch (error) {
        next(error);
    }
};
