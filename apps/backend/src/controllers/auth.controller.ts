import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { getMergedPermissions } from '../config/rolePermissions.config.js';
import { recordAuditLog } from '../utils/logger.js';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: username.toLowerCase() }).populate('branchId');

        if (user && (await (user as any).matchPassword(password))) {
            // Get merged permissions based on role and custom permissions
            const permissions = getMergedPermissions(
                user.role,
                (user as any).useCustomPermissions ? (user as any).customPermissions : undefined
            );

            res.json({
                _id: user._id,
                username: (user as any).username,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId,
                department: user.department,
                branchId: (user as any).branchId,
                avatarUrl: user.avatarUrl,
                token: generateToken(user._id.toString()),
                permissions
            });

            // Record Audit Log
            await recordAuditLog({
                userId: user._id.toString(),
                action: 'login',
                resourceType: 'User',
                resourceId: user._id.toString(),
                resourceName: user.name,
                details: `User logged in: ${user.username}`,
                branchId: (user as any).branchId?._id || (user as any).branchId,
                departmentId: user.departmentId?.toString()
            });
        } else {
            res.status(401);
            throw new Error('Invalid username or password');
        }
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user._id).populate('branchId');
        if (user) {
            // Get merged permissions based on role and custom permissions
            const permissions = getMergedPermissions(
                user.role,
                (user as any).useCustomPermissions ? (user as any).customPermissions : undefined
            );

            res.json({
                _id: user._id,
                username: (user as any).username,
                name: user.name,
                email: user.email,
                role: user.role,
                departmentId: user.departmentId,
                department: user.department,
                branchId: (user as any).branchId,
                avatarUrl: user.avatarUrl,
                permissions
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};
export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.avatarUrl = req.body.avatarUrl || user.avatarUrl;

        if (req.body.phone !== undefined) {
            (user as any).phone = req.body.phone;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            username: (updatedUser as any).username,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            department: updatedUser.department,
            branchId: (updatedUser as any).branchId
        });
    } catch (error) {
        next(error);
    }
};
