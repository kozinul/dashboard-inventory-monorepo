import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/role.model.js';

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin/Superuser)
export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roles = await Role.find({});
        res.json(roles);
    } catch (error) {
        next(error);
    }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = await Role.findById(req.params.id);
        if (role) {
            res.json(role);
        } else {
            res.status(404);
            throw new Error('Role not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a role
// @route   POST /api/roles
// @access  Private (Admin/Superuser)
export const createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, slug, description, permissions } = req.body;

        const roleExists = await Role.findOne({ slug });
        if (roleExists) {
            res.status(400);
            throw new Error('Role already exists');
        }

        const role = await Role.create({
            name,
            slug,
            description,
            permissions
        });

        res.status(201).json(role);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private (Admin/Superuser)
export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = await Role.findById(req.params.id);

        if (role) {
            if (role.isSystem && req.body.slug && req.body.slug !== role.slug) {
                res.status(400);
                throw new Error('Cannot change slug of system roles');
            }

            role.name = req.body.name || role.name;
            role.description = req.body.description || role.description;
            // Only update slug if provided and check uniqueness handled by mongo index or separate check ideally
            if (req.body.slug) role.slug = req.body.slug;

            if (req.body.permissions) {
                role.permissions = req.body.permissions;
            }

            const updatedRole = await role.save();
            res.json(updatedRole);
        } else {
            res.status(404);
            throw new Error('Role not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private (Admin/Superuser)
export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = await Role.findById(req.params.id);

        if (role) {
            if (role.isSystem) {
                res.status(400);
                throw new Error('Cannot delete system roles');
            }
            await Role.deleteOne({ _id: role._id });
            res.json({ message: 'Role removed' });
        } else {
            res.status(404);
            throw new Error('Role not found');
        }
    } catch (error) {
        next(error);
    }
};
