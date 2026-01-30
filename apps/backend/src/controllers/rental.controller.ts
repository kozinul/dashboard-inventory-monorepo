import { Request, Response } from 'express';
import Rental from '../models/rental.model';

export const createRental = async (req: Request, res: Response) => {
    try {
        const rental = new Rental(req.body);
        await rental.save();
        // Populate references for the response
        await rental.populate(['assetId', 'userId', 'eventId']);
        res.status(201).json(rental);
    } catch (error) {
        res.status(500).json({ message: 'Error creating rental', error });
    }
};

export const getRentals = async (req: Request, res: Response) => {
    try {
        const rentals = await Rental.find()
            .populate('assetId')
            .populate('userId')
            .populate('eventId')
            .sort({ rentalDate: -1 });
        res.status(200).json(rentals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rentals', error });
    }
};

export const getRentalById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findById(id)
            .populate('assetId')
            .populate('userId')
            .populate('eventId');

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }
        res.status(200).json(rental);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rental', error });
    }
};

export const updateRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findByIdAndUpdate(id, req.body, { new: true })
            .populate('assetId')
            .populate('userId')
            .populate('eventId');

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }
        res.status(200).json(rental);
    } catch (error) {
        res.status(500).json({ message: 'Error updating rental', error });
    }
};

export const deleteRental = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findByIdAndDelete(id);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }
        res.status(200).json({ message: 'Rental deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting rental', error });
    }
};
