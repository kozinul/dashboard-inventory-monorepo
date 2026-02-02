import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { getMergedPermissions } from '../config/rolePermissions.config.js';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: username.toLowerCase() });

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
                token: generateToken(user._id.toString()),
                permissions
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
        const user = await User.findById(req.user._id);
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
