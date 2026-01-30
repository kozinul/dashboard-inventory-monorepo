import { Request, Response } from 'express';
import { Supply } from '../models/supply.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';

export const createSupply = async (req: Request, res: Response) => {
    try {
        const supply = new Supply(req.body);
        await supply.save();

        // Create initial history
        await SupplyHistory.create({
            supplyId: supply._id,
            action: 'CREATE',
            quantityChange: supply.quantity,
            newStock: supply.quantity,
            notes: 'Initial stock'
        });

        res.status(201).json(supply);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Part number already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

export const getAllSupplies = async (req: Request, res: Response) => {
    try {
        const { search, category, lowStock } = req.query;
        let query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { partNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        if (lowStock === 'true') {
            query.$expr = { $lt: ["$quantity", "$minimumStock"] };
        }

        const supplies = await Supply.find(query)
            .sort({ createdAt: -1 })
            .populate('locationId', 'name')
            .populate('vendorId', 'name')
            .populate('departmentId', 'name code')
            .populate('unitId', 'name symbol');

        res.json(supplies);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSupplyById = async (req: Request, res: Response) => {
    try {
        const supply = await Supply.findById(req.params.id)
            .populate('locationId', 'name')
            .populate('vendorId', 'name')
            .populate('departmentId', 'name code')
            .populate('unitId', 'name symbol');

        if (!supply) {
            return res.status(404).json({ message: 'Supply not found' });
        }
        res.json(supply);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const updateSupply = async (req: Request, res: Response) => {
    try {
        const oldSupply = await Supply.findById(req.params.id);
        if (!oldSupply) {
            return res.status(404).json({ message: 'Supply not found' });
        }

        const supply = await Supply.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (supply) {
            // Check for stock changes
            if (oldSupply.quantity !== supply.quantity) {
                const diff = supply.quantity - oldSupply.quantity;
                const action = diff > 0 ? 'RESTOCK' : 'USE';

                await SupplyHistory.create({
                    supplyId: supply._id,
                    action: action,
                    quantityChange: diff,
                    previousStock: oldSupply.quantity,
                    newStock: supply.quantity,
                    notes: req.body.reason || 'Stock update'
                });
            } else {
                // Generic update
                await SupplyHistory.create({
                    supplyId: supply._id,
                    action: 'UPDATE',
                    quantityChange: 0,
                    previousStock: oldSupply.quantity,
                    newStock: supply.quantity,
                    notes: 'Details updated'
                });
            }
        }
        res.json(supply);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Part number already exists' });
        }
        res.status(400).json({ message: error.message });
    }
};

export const deleteSupply = async (req: Request, res: Response) => {
    try {
        const supply = await Supply.findByIdAndDelete(req.params.id);
        if (!supply) {
            return res.status(404).json({ message: 'Supply not found' });
        }
        res.json({ message: 'Supply deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
export const getSupplyHistory = async (req: Request, res: Response) => {
    try {
        const history = await SupplyHistory.find({ supplyId: req.params.id })
            .sort({ createdAt: -1 })
            .populate('userId', 'name');
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
