import { Request, Response, NextFunction } from 'express';
import Event from '../models/event.model.js';
import { Supply } from '../models/supply.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Asset } from '../models/asset.model.js';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const event = new Event({
            ...req.body,
            // Set branchId based on user role
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId,
            departmentId: req.user.departmentId,
            createdBy: req.user._id
        });
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error });
    }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};

        if (req.user.role !== 'superuser') {
            filter.branchId = (req.user as any).branchId;
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            filter.branchId = req.query.branchId;
        }

        let events = await Event.find(filter)
            .populate('departmentId', 'name')
            .sort({ startTime: -1 });

        // RBAC: Previously filtered by department for non-admin users.
        // Now allowed for all users in the same branch as requested.

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate('rentedAssets.assetId')
            .populate('planningSupplies.supplyId')
            .populate('departmentId', 'name');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // RBAC: Check if user can access this event
        // RBAC: Check branch access for non-superuser
        if (req.user.role !== 'superuser' && event.branchId && event.branchId.toString() !== (req.user as any).branchId?.toString()) {
            return res.status(403).json({ message: 'Access denied: Event belongs to another branch' });
        }

        // RBAC: Cross-department visibility allowed. Ensure branch match for non-superusers.

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error });
    }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const currentEvent = await Event.findById(id);

        if (!currentEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // RBAC: Technician can only update assets and supplies
        if (req.user.role === 'technician') {
            const allowedFields = ['rentedAssets', 'planningSupplies'];
            const updateKeys = Object.keys(req.body);
            const isProhibited = updateKeys.some(key => !allowedFields.includes(key));

            if (isProhibited) {
                return res.status(403).json({
                    message: 'Technicians are only authorized to manage assets and supplies. Core event details or status changes must be handled by a Supervisor or Manager.'
                });
            }
        }

        const newStatus = req.body.status;
        const oldStatus = currentEvent.status;

        // Handle Dynamic Supply Updates for Booked/Ongoing events
        const isLive = ['scheduled', 'ongoing'].includes(newStatus || oldStatus);
        if (isLive && req.body.planningSupplies) {
            const oldSupplies = currentEvent.planningSupplies || [];
            const newSupplies = req.body.planningSupplies;

            // Simple diffing logic
            const oldMap = new Map(oldSupplies.map(s => [s.supplyId.toString(), s.quantity]));
            const newMap = new Map();

            // Process new supplies
            for (const item of newSupplies) {
                const sId = item.supplyId.toString();
                const newQty = item.quantity;
                const oldQty = oldMap.get(sId) || 0;
                const diff = newQty - oldQty;

                if (diff !== 0) {
                    const supply = await Supply.findById(sId);
                    if (supply) {
                        const oldStock = supply.quantity;
                        supply.quantity -= diff; // Deduct if addition, add back if reduction
                        await supply.save();

                        await SupplyHistory.create({
                            supplyId: supply._id,
                            action: diff > 0 ? 'USE' : 'RESTOCK',
                            quantityChange: -diff,
                            previousStock: oldStock,
                            newStock: supply.quantity,
                            notes: `Updated in event: ${currentEvent.name}`
                        });
                    }
                }
                newMap.set(sId, true);
            }

            // Process removed supplies
            for (const item of oldSupplies) {
                const sId = item.supplyId.toString();
                if (!newMap.has(sId)) {
                    const supply = await Supply.findById(sId);
                    if (supply) {
                        const oldStock = supply.quantity;
                        supply.quantity += item.quantity;
                        await supply.save();

                        await SupplyHistory.create({
                            supplyId: supply._id,
                            action: 'RESTOCK',
                            quantityChange: item.quantity,
                            previousStock: oldStock,
                            newStock: supply.quantity,
                            notes: `Removed from event: ${currentEvent.name}`
                        });
                    }
                }
            }
        }

        const event = await Event.findByIdAndUpdate(id, req.body, { new: true })
            .populate('rentedAssets.assetId')
            .populate('planningSupplies.supplyId')
            .populate('departmentId', 'name');

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error });
    }
};


export const getEventsByAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId } = req.params;
        const events = await Event.find({ 'rentedAssets.assetId': assetId })
            .sort({ startTime: -1 }) // Newest first
            .populate('rentedAssets.assetId');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching asset history', error });
    }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const eventToCheck = await Event.findById(id);

        if (!eventToCheck) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // RBAC: Technician cannot delete events
        if (req.user.role === 'technician') {
            return res.status(403).json({ message: 'Technicians are not authorized to delete events.' });
        }

        // Allow deletion if:
        // 1. No rented assets
        // 2. OR Status is Planning (assets are just a wishlist, not blocked)
        // 3. OR Status is Cancelled (resources already released)
        const hasAssets = eventToCheck.rentedAssets && eventToCheck.rentedAssets.length > 0;
        const isSafeStatus = eventToCheck.status === 'planning' || eventToCheck.status === 'cancelled';

        if (hasAssets && !isSafeStatus) {
            return res.status(400).json({ message: 'Cannot delete scheduled/ongoing event with assigned assets. Please release resources first.' });
        }

        // Also check supplies? The requirement specifically mentioned assets ("tidak ada asset disana").
        // But logical to check supplies too or just let them go. I'll stick to assets as requested.

        await Event.findByIdAndDelete(id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error });
    }
};
