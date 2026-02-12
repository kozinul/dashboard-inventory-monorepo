import { Request, Response } from 'express';
import { Supply } from '../models/supply.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';

export const createSupply = async (req: Request, res: Response) => {
    try {
        const supply = new Supply({
            ...req.body,
            // Set branchId based on user role
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId
        });
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

        // RBAC: Department filtering for non-admin users
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                query.departmentId = req.user.departmentId;
            } else {
                // No department = no access
                return res.json([]);
            }
        }

        // Filter by branch
        if (req.user.role !== 'superuser') {
            query.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            query.branchId = req.query.branchId;
        }

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
        console.error('Error fetching supplies:', error);
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

        // RBAC: Check if user can access this supply
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (supply.departmentId?._id?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
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

        // RBAC: Check if user can update this supply
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (oldSupply.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'You can only update supplies from your department' });
            }
            // Prevent changing department
            if (req.body.departmentId && req.body.departmentId !== req.user.departmentId) {
                return res.status(403).json({ message: 'You cannot transfer supplies to other departments' });
            }
        }

        const updateData = { ...req.body };
        // Superusers can change branchId if provided
        if (req.user.role === 'superuser' && req.body.branchId) {
            updateData.branchId = req.body.branchId;
        } else {
            // Non-superusers cannot change branchId
            delete updateData.branchId;
        }

        const supply = await Supply.findByIdAndUpdate(
            req.params.id,
            updateData,
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
        const supply = await Supply.findById(req.params.id);
        if (!supply) {
            return res.status(404).json({ message: 'Supply not found' });
        }

        // RBAC: Check if user can delete this supply
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (supply.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'You can only delete supplies from your department' });
            }
        }

        await Supply.findByIdAndDelete(req.params.id);
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
