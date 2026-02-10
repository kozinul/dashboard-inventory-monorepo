import { Request, Response } from 'express';
import Event from '../models/event.model.js';
import { Supply } from '../models/supply.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Asset } from '../models/asset.model.js';

export const createEvent = async (req: Request, res: Response) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    try {
        let events = await Event.find().sort({ startTime: 1 });

        // RBAC: Filter by department for non-admin users
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                // Filter events that have assets from user's department
                const eventsWithAccess = [];
                for (const event of events) {
                    if (event.rentedAssets && event.rentedAssets.length > 0) {
                        // Check if any asset belongs to user's department
                        const assetIds = event.rentedAssets.map(ra => ra.assetId);
                        const assets = await Asset.find({ _id: { $in: assetIds }, departmentId: req.user.departmentId });
                        if (assets.length > 0) {
                            eventsWithAccess.push(event);
                        }
                    }
                }
                events = eventsWithAccess;
            } else {
                return res.json([]);
            }
        }

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error });
    }
};

export const getEventById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id)
            .populate('rentedAssets.assetId')
            .populate('planningSupplies.supplyId');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // RBAC: Check if user can access this event
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId && event.rentedAssets && event.rentedAssets.length > 0) {
                // Check if any asset belongs to user's department
                const assetIds = event.rentedAssets.map(ra => ra.assetId);
                const assets = await Asset.find({ _id: { $in: assetIds }, departmentId: req.user.departmentId });
                if (assets.length === 0) {
                    return res.status(403).json({ message: 'Access denied' });
                }
            } else if (!req.user.departmentId) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error });
    }
};

export const updateEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const currentEvent = await Event.findById(id);

        if (!currentEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const newStatus = req.body.status;
        const oldStatus = currentEvent.status;

        // Handle Supply Logic on Status Change
        if (newStatus && newStatus !== oldStatus) {
            // Planning -> Scheduled (Booking): Deduct Stock
            if (oldStatus === 'planning' && newStatus === 'scheduled') {
                for (const item of currentEvent.planningSupplies) {
                    const supply = await Supply.findById(item.supplyId);
                    if (supply) {
                        const oldStock = supply.quantity;
                        supply.quantity -= item.quantity;
                        await supply.save();

                        await SupplyHistory.create({
                            supplyId: supply._id,
                            action: 'USE',
                            quantityChange: -item.quantity,
                            previousStock: oldStock,
                            newStock: supply.quantity,
                            notes: `Used in event: ${currentEvent.name}`
                        });
                    }
                }
            }
            // Scheduled -> Planning (Release): Revert Stock
            else if (oldStatus === 'scheduled' && newStatus === 'planning') {
                for (const item of currentEvent.planningSupplies) {
                    const supply = await Supply.findById(item.supplyId);
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
                            notes: `Released from event: ${currentEvent.name}`
                        });
                    }
                }
            }
            // Scheduled -> Cancelled (Cancel): Revert Stock
            else if (oldStatus === 'scheduled' && newStatus === 'cancelled') {
                for (const item of currentEvent.planningSupplies) {
                    const supply = await Supply.findById(item.supplyId);
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
                            notes: `Event cancelled: ${currentEvent.name}`
                        });
                    }
                }
            }
        }

        const event = await Event.findByIdAndUpdate(id, req.body, { new: true })
            .populate('rentedAssets.assetId')
            .populate('planningSupplies.supplyId');

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error });
    }
};


export const getEventsByAsset = async (req: Request, res: Response) => {
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

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const eventToCheck = await Event.findById(id);

        if (!eventToCheck) {
            return res.status(404).json({ message: 'Event not found' });
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
