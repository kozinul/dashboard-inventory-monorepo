import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

import { Role } from '../models/role.model.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await (user as any).matchPassword(password))) {
            // Fetch dynamic permissions
            const roleDoc = await Role.findOne({ slug: user.role });
            let permissions = roleDoc ? roleDoc.permissions : [];

            // Fallback for legacy static roles/superuser if no dynamic role exists yet
            if (!roleDoc && (user.role === 'superuser' || user.role === 'admin')) {
                // Return a special flag or wildcard permissions?
                // For now, let's assume frontend handles "if no permissions but role is admin, allow all"
                // OR we can construct full permissions here.
                // Let's rely on Sidebar falling back to "isAdmin" check if permissions array is empty but role is admin
            }

            res.json({
                _id: user._id,
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
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            // Fetch dynamic permissions
            const roleDoc = await Role.findOne({ slug: user.role });
            let permissions = roleDoc ? roleDoc.permissions : [];

            res.json({
                _id: user._id,
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
