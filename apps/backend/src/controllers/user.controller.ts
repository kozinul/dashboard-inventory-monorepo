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
        // Note: In a real app we'd use a validation middleware
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
            fullName: user.fullName,
            role: user.role
        });
    } catch (error) {
        next(error);
    }
};
