import { Request, Response } from 'express';
import { Vendor } from '../models/vendor.model.js';

export const vendorController = {
    // Get all vendors
    getAll: async (req: Request, res: Response) => {
        try {
            const vendors = await Vendor.find().sort({ createdAt: -1 });
            res.json(vendors);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vendors", error });
        }
    },

    // Get single vendor
    getOne: async (req: Request, res: Response) => {
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json(vendor);
        } catch (error) {
            res.status(500).json({ message: "Error fetching vendor", error });
        }
    },

    // Create a new vendor
    create: async (req: Request, res: Response) => {
        try {
            const newVendor = new Vendor(req.body);
            const savedVendor = await newVendor.save();
            res.status(201).json(savedVendor);
        } catch (error) {
            res.status(400).json({ message: "Error creating vendor", error });
        }
    },

    // Update a vendor
    update: async (req: Request, res: Response) => {
        try {
            const updatedVendor = await Vendor.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            if (!updatedVendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json(updatedVendor);
        } catch (error) {
            res.status(400).json({ message: "Error updating vendor", error });
        }
    },

    // Delete a vendor
    delete: async (req: Request, res: Response) => {
        try {
            const deletedVendor = await Vendor.findByIdAndDelete(req.params.id);
            if (!deletedVendor) {
                return res.status(404).json({ message: "Vendor not found" });
            }
            res.json({ message: "Vendor deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting vendor", error });
        }
    }
};
