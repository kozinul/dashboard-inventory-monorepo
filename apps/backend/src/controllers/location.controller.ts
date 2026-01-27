import { Request, Response } from 'express';
import { Location } from '../models/location.model.js';

export const getLocations = async (req: Request, res: Response) => {
    try {
        const locations = await Location.find().sort({ name: 1 });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching locations', error });
    }
};

export const createLocation = async (req: Request, res: Response) => {
    try {
        const location = new Location(req.body);
        await location.save();
        res.status(201).json(location);
    } catch (error) {
        res.status(400).json({ message: 'Error creating location', error });
    }
};

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const location = await Location.findByIdAndUpdate(id, req.body, { new: true });
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
