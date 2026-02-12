import { Request, Response } from 'express';
import { Location } from '../models/location.model.js';

export const getLocations = async (req: Request, res: Response) => {
    try {
        // Build filter based on user role and branch
        const filter: any = {};

        if (req.user.role !== 'superuser') {
            filter.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        const locations = await Location.find(filter).sort({ name: 1 });
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
            branchId
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

        const location = await Location.findByIdAndUpdate(id, updateData, { new: true });
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
