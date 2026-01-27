import { Request, Response } from 'express';
import { LocationType } from '../models/locationType.model.js';

export const getLocationTypes = async (req: Request, res: Response) => {
    try {
        const types = await LocationType.find().sort({ level: 1, name: 1 });
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching location types', error });
    }
};

export const createLocationType = async (req: Request, res: Response) => {
    try {
        const locationType = new LocationType(req.body);
        await locationType.save();
        res.status(201).json(locationType);
    } catch (error) {
        res.status(400).json({ message: 'Error creating location type', error });
    }
};

export const updateLocationType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const locationType = await LocationType.findByIdAndUpdate(id, req.body, { new: true });
        if (!locationType) {
            return res.status(404).json({ message: 'Location type not found' });
        }
        res.json(locationType);
    } catch (error) {
        res.status(400).json({ message: 'Error updating location type', error });
    }
};

export const deleteLocationType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const locationType = await LocationType.findByIdAndDelete(id);
        if (!locationType) {
            return res.status(404).json({ message: 'Location type not found' });
        }
        res.json({ message: 'Location type deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting location type', error });
    }
};
