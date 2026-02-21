import { Request, Response, NextFunction } from 'express';
import { Vendor } from '../models/vendor.model.js';

export const vendorController = {
    // Get all vendors
    getAll: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Build filter based on user role and branch
            const filter: any = {};

            if (req.user.role !== 'superuser') {
                const userBranchId = (req.user as any).branchId;
                if (userBranchId) {
                    filter.$or = [
                        { branchId: userBranchId },
                        { branchId: null },
                        { branchId: { $exists: false } }
                    ];
                } else {
                    filter.$or = [
                        { branchId: null },
                        { branchId: { $exists: false } }
                    ];
                }
            } else if (req.query.branchId && req.query.branchId !== 'ALL') {
                filter.branchId = req.query.branchId;
            }

            const vendors = await Vendor.find(filter).sort({ createdAt: -1 });
            res.json(vendors);
        } catch (error) {
            next(error);
        }
    },

    // Get single vendor
    getOne: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json(vendor);
        } catch (error) {
            next(error);
        }
    },

    // Create a new vendor
    create: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Set branchId based on user role
            const branchId = req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId;

            const newVendor = new Vendor({
                ...req.body,
                branchId
            });
            const savedVendor = await newVendor.save();
            res.status(201).json(savedVendor);
        } catch (error) {
            next(error);
        }
    },

    // Update a vendor
    update: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const updateData = { ...req.body };

            // Superusers can change branchId if provided
            if (req.user.role === 'superuser' && req.body.branchId) {
                updateData.branchId = req.body.branchId;
            } else {
                // Non-superusers cannot change branchId
                delete updateData.branchId;
            }

            const updatedVendor = await Vendor.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true }
            );
            if (!updatedVendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json(updatedVendor);
        } catch (error) {
            next(error);
        }
    },

    // Delete a vendor
    delete: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const deletedVendor = await Vendor.findByIdAndDelete(req.params.id);
            if (!deletedVendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json({ message: "Vendor deleted successfully" });
        } catch (error) {
            next(error);
        }
    }
};
