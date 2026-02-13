import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model.js';
import { CreateUserSchema } from '@dashboard/schemas'; // Assuming this export exists or we fix it to allow import
// If @dashboard/schemas is not linked yet, this might fail in strict compilation, but code is correct.

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};

        // RBAC: Previously Managers were restricted to their department.
        // Removed to allow cross-department assignments.
        // if (req.user && req.user.role === 'manager' && req.user.departmentId) {
        //     filter.departmentId = req.user.departmentId;
        // }
        // Superuser/Admin see all users

        const users = await User.find(filter).select('-password').populate('branchId');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id).select('-password').populate('branchId');
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        // RBAC: Managers can only view users from their department
        if (req.user && req.user.role === 'manager') {
            const isDeptMatch =
                (user.departmentId && req.user.departmentId && user.departmentId.toString() === req.user.departmentId.toString()) ||
                (user.department && req.user.department && user.department === req.user.department);

            if (!isDeptMatch) {
                res.status(403);
                throw new Error('Access denied');
            }
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

        // Protect Superuser from being edited
        if (user.role === 'superuser') {
            res.status(403);
            throw new Error('Superuser cannot be edited');
        }

        // RBAC: Managers can only edit users from their department
        if (req.user && req.user.role === 'manager') {
            const isDeptMatch =
                (user.departmentId && req.user.departmentId && user.departmentId.toString() === req.user.departmentId.toString()) ||
                (user.department && req.user.department && user.department === req.user.department);

            if (!isDeptMatch) {
                res.status(403);
                throw new Error('You can only edit users from your department');
            }
            // Prevent changing department to one you don't own
            if (req.body.departmentId && req.body.departmentId !== req.user.departmentId) {
                if (req.user.departmentId) {
                    req.body.departmentId = req.user.departmentId;
                } else {
                    res.status(403);
                    throw new Error('You cannot transfer users to other departments');
                }
            }
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.department = req.body.department || user.department;
        user.departmentId = req.body.departmentId || user.departmentId;
        user.designation = req.body.designation || user.designation;
        user.status = req.body.status || user.status;
        user.role = req.body.role || user.role;
        user.branchId = req.body.branchId || user.branchId;
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
            branchId: updatedUser.branchId,
            avatarUrl: updatedUser.avatarUrl,
            isActive: (updatedUser as any).isActive,
            lastLogin: (updatedUser as any).lastLogin,
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

        // Protect Superuser from being deleted
        if (user.role === 'superuser') {
            res.status(403);
            throw new Error('Superuser cannot be deleted');
        }

        // RBAC: Managers can only delete users from their department
        if (req.user && req.user.role === 'manager') {
            const isDeptMatch =
                (user.departmentId && req.user.departmentId && user.departmentId.toString() === req.user.departmentId.toString()) ||
                (user.department && req.user.department && user.department === req.user.department);

            if (!isDeptMatch) {
                res.status(403);
                throw new Error('You can only delete users from your department');
            }
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
