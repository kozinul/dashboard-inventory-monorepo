import { Request, Response, NextFunction } from 'express';
import Event from '../models/event.model.js';
import { Supply } from '../models/supply.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Asset } from '../models/asset.model.js';
import { recordAuditLog } from '../utils/logger.js';

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const event = new Event({
            ...req.body,
            // Set branchId based on user role
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId,
            departmentId: req.user.departmentId,
            createdBy: req.user._id,
            activityLog: [{
                action: 'created_event',
                details: 'Event created',
                performedBy: req.user._id,
                date: new Date()
            }]
        });
        await event.save();

        // Update Asset Status to 'event' if assets are assigned
        if (event.rentedAssets && event.rentedAssets.length > 0) {
            for (const item of event.rentedAssets) {
                await Asset.findByIdAndUpdate(item.assetId, { status: 'event' });
            }
        }

        // Record Audit Log
        await recordAuditLog({
            userId: req.user._id.toString(),
            action: 'create_event',
            resourceType: 'Event',
            resourceId: event._id.toString(),
            resourceName: event.name,
            details: `Event ${event.name} created with ${event.rentedAssets?.length || 0} assets assigned`,
            branchId: event.branchId?.toString(),
            departmentId: event.departmentId?.toString()
        });

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
            .populate('createdBy', 'name username')
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
            .populate('departmentId', 'name')
            .populate('createdBy', 'name username')
            .populate('activityLog.performedBy', 'name username');
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

        const activityLogs = [];
        if (newStatus && newStatus !== oldStatus) {
            activityLogs.push({ action: 'status_changed', details: `Status changed to ${newStatus}`, performedBy: req.user._id, date: new Date() });
        }

        if (req.body.rentedAssets) {
            const oldAssets = currentEvent.rentedAssets?.length || 0;
            const newAssets = req.body.rentedAssets.length;
            if (newAssets > oldAssets) {
                activityLogs.push({ action: 'assets_added', details: `Added ${newAssets - oldAssets} asset(s)`, performedBy: req.user._id, date: new Date() });
            } else if (newAssets < oldAssets) {
                activityLogs.push({ action: 'assets_removed', details: `Removed ${oldAssets - newAssets} asset(s)`, performedBy: req.user._id, date: new Date() });
            }
        }

        if (req.body.planningSupplies) {
            const oldSupplies = currentEvent.planningSupplies?.length || 0;
            const newSupplies = req.body.planningSupplies.length;
            if (newSupplies > oldSupplies) {
                activityLogs.push({ action: 'supplies_added', details: `Added ${newSupplies - oldSupplies} supply item(s)`, performedBy: req.user._id, date: new Date() });
            } else if (newSupplies < oldSupplies) {
                activityLogs.push({ action: 'supplies_removed', details: `Removed ${oldSupplies - newSupplies} supply item(s)`, performedBy: req.user._id, date: new Date() });
            }
        }

        const updateData = { ...req.body };
        if (activityLogs.length > 0) {
            updateData.$push = { activityLog: { $each: activityLogs } };
            delete updateData.activityLog; // Ensure we don't override the array entirely
        }

        const event = await Event.findByIdAndUpdate(id, updateData, { new: true })
            .populate('rentedAssets.assetId')
            .populate('planningSupplies.supplyId')
            .populate('departmentId', 'name')
            .populate('createdBy', 'name username')
            .populate('activityLog.performedBy', 'name username');

        // Record Audit Log
        await recordAuditLog({
            userId: req.user._id.toString(),
            action: 'update_event',
            resourceType: 'Event',
            resourceId: id,
            resourceName: (event as any)?.name || 'Event',
            details: `Event updated by ${req.user.name}. Status: ${event?.status}`,
            branchId: (event as any)?.branchId?.toString(),
            departmentId: (event as any)?.departmentId?.toString()
        });

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

        // RBAC Deletion Rules:
        const isSuperuser = ['superuser', 'system_admin', 'admin'].includes(req.user.role);

        if (eventToCheck.status === 'completed') {
            if (!isSuperuser) {
                return res.status(403).json({ message: 'Only Superusers or Admins can delete completed events.' });
            }
        } else {
            const hasAssets = eventToCheck.rentedAssets && eventToCheck.rentedAssets.length > 0;
            const hasSupplies = eventToCheck.planningSupplies && eventToCheck.planningSupplies.length > 0;

            if (!isSuperuser) {
                if (eventToCheck.status !== 'planning' || hasAssets || hasSupplies) {
                    return res.status(403).json({ message: 'Regular users can only delete new events that are in planning and have no assets/supplies booked.' });
                }
            }
        }

        // Also check supplies? The requirement specifically mentioned assets ("tidak ada asset disana").
        // But logical to check supplies too or just let them go. I'll stick to assets as requested.

        // Reset Asset Status if event is deleted
        if (eventToCheck.rentedAssets && eventToCheck.rentedAssets.length > 0) {
            for (const item of eventToCheck.rentedAssets) {
                await Asset.findByIdAndUpdate(item.assetId, { status: 'active' });
            }
        }

        // Record Audit Log
        await recordAuditLog({
            userId: req.user._id.toString(),
            action: 'delete_event',
            resourceType: 'Event',
            resourceId: id,
            resourceName: eventToCheck.name,
            details: `Event ${eventToCheck.name} deleted, assets reset to active`,
            branchId: eventToCheck.branchId?.toString(),
            departmentId: eventToCheck.departmentId?.toString()
        });

        await Event.findByIdAndDelete(id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error });
    }
};
