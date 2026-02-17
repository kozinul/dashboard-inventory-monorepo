import { Request, Response } from 'express';
import { Location } from '../models/location.model.js';

export const getLocations = async (req: Request, res: Response) => {
    try {
        // Build filter based on user role and branch
        const filter: any = {};

        if (req.user.role !== 'superuser') {
            const userBranchId = (req.user as any).branchId;
            if (userBranchId) {
                // Determine if we should only show branch locations or also global ones
                // Assuming locations are strictly branch-bound usually, but for safety let's allow global if any
                filter.$or = [
                    { branchId: userBranchId },
                    { branchId: null },
                    { branchId: { $exists: false } }
                ];

                // If user is not admin/superuser, filter by department too
                if (!['admin', 'system_admin'].includes(req.user.role)) {
                    const userDeptId = (req.user as any).departmentId;
                    if (userDeptId) {
                        filter.$and = [
                            {
                                $or: [
                                    { departmentId: userDeptId },
                                    { departmentId: null },
                                    { departmentId: { $exists: false } }
                                ]
                            }
                        ];
                    }
                }
            } else {
                filter.$or = [
                    { branchId: null },
                    { branchId: { $exists: false } }
                ];
            }
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        // Filter by type
        if (req.query.type) {
            const types = (req.query.type as string).split(',');
            filter.type = { $in: types };
        }

        const locations = await Location.find(filter)
            .populate('departmentId', 'name')
            .sort({ name: 1 });

        res.json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ message: 'Error fetching locations', error });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        // Set branchId based on user role
        const branchId = req.user.role === 'superuser'
            ? (req.body.branchId || (req.user as any).branchId)
            : (req.user as any).branchId;

        const location = new Location({
            ...req.body,
            branchId,
            departmentId: req.body.departmentId || undefined,
            isWarehouse: req.body.isWarehouse || false,
            capacity: req.body.capacity || 0
        });
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        res.status(400).json({ message: 'Error creating location', error });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Superusers can change branchId if provided
        if (req.user.role === 'superuser' && req.body.branchId) {
            updateData.branchId = req.body.branchId;
        } else {
            // Non-superusers cannot change branchId
            delete updateData.branchId;
        }

        // Handle departmentId and isWarehouse
        if (req.body.departmentId === "") {
            updateData.departmentId = null;
        } else if (req.body.departmentId) {
            updateData.departmentId = req.body.departmentId;
        }

        if (req.body.isWarehouse !== undefined) updateData.isWarehouse = req.body.isWarehouse;
        if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;

        const location = await Location.findByIdAndUpdate(id, updateData, { new: true }).populate('departmentId', 'name');
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(400).json({ message: 'Error updating location', error });
    }
};

export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Check for children
        const hasChildren = await Location.exists({ parentId: id });
        if (hasChildren) {
            return res.status(400).json({ message: 'Cannot delete location with children' });
        }

        const location = await Location.findByIdAndDelete(id);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting location', error });
    }
};

export const getLocationById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const location = await Location.findById(id).populate('departmentId', 'name').populate('parentId', 'name');
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching location', error });
    }
};
