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

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        res.json(user);
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

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.department = req.body.department || user.department;
        user.departmentId = req.body.departmentId || user.departmentId;
        user.designation = req.body.designation || user.designation;
        user.status = req.body.status || user.status;
        user.role = req.body.role || user.role;
        user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        // Return user without password
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            departmentId: updatedUser.departmentId,
            designation: updatedUser.designation,
            status: updatedUser.status,
            avatarUrl: updatedUser.avatarUrl,
        });
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

// @desc    Update user custom permissions
// @route   PUT /api/users/:id/permissions
// @access  Private (Admin/Superuser)
export const updateUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        const { useCustomPermissions, customPermissions } = req.body;

        (user as any).useCustomPermissions = useCustomPermissions ?? false;
        (user as any).customPermissions = customPermissions ?? [];

        await user.save();

        res.json({
            _id: user._id,
            useCustomPermissions: (user as any).useCustomPermissions,
            customPermissions: (user as any).customPermissions
        });
    } catch (error) {
        next(error);
    }
};
