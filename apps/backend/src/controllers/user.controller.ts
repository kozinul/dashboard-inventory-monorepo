import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { CreateUserSchema } from '@dashboard/schemas'; // Assuming this export exists or we fix it to allow import
// If @dashboard/schemas is not linked yet, this might fail in strict compilation, but code is correct.

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate with Zod
        const validatedData = CreateUserSchema.parse(req.body);

        const userExists = await User.findOne({ email: validatedData.email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create(validatedData);

        res.status(201).json({
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        await user.deleteOne();

        res.json({ message: 'User removed' });
    } catch (error) {
        next(error);
    }
};
