import { Request, Response, NextFunction } from 'express';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { Asset } from '../models/asset.model.js';
import { Assignment } from '../models/assignment.model.js';
import { User } from '../models/user.model.js';
import { Supply } from '../models/supply.model.js';

// Get all maintenance records (for admin/managers)
export const getMaintenanceRecords = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = {};
        if (req.query.serviceProviderType) {
            filter.serviceProviderType = req.query.serviceProviderType;
        }
        if (req.query.asset) {
            filter.asset = req.query.asset;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.supply) {
            filter['suppliesUsed.supply'] = req.query.supply;
        }
        // Filtering unassigned tickets for non-admin users
        const userRole = req.user.role;
        const userId = req.user._id;

        if (userRole === 'manager') {
            const manager = await User.findById(userId);
            if (manager && manager.departmentId) {
                // Same logic as getDepartmentTickets
                const departmentUsers = await User.find({ departmentId: manager.departmentId }).select('_id');
                const userIds = departmentUsers.map(u => u._id);

                const departmentAssets = await Asset.find({ departmentId: manager.departmentId }).select('_id');
                const assetIds = departmentAssets.map(a => a._id);

                filter.$or = [
                    { requestedBy: { $in: userIds } },
                    { assignedDepartment: manager.departmentId },
                    { asset: { $in: assetIds } }
                ];
            } else {
                // Manager with no department sees nothing (or empty list)
                return res.json([]);
            }
        } else if (userRole !== 'superuser' && userRole !== 'admin') {
            filter.technician = { $exists: true, $ne: null };
        }

        const records = await MaintenanceRecord.find(filter)
            .populate('asset', 'name serial department departmentId')
            .populate('technician', 'name avatar')
            .populate('vendor', 'name')
            .populate('requestedBy', 'name email department')
            .populate('processedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

// Get my tickets (for logged in user)
export const getMyTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const records = await MaintenanceRecord.find({ requestedBy: userId })
            .populate('asset', 'name serial department departmentId')
            .populate('processedBy', 'name')
            .populate({
                path: 'history.changedBy',
                select: 'name avatar'
            })
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

// Get tickets assigned to me (for technician)
export const getAssignedTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const records = await MaintenanceRecord.find({ technician: userId })
            .populate('asset', 'name serial department departmentId')
            .populate('technician', 'name avatar')
            .populate('requestedBy', 'name email department')
            .populate('processedBy', 'name')
            .populate({
                path: 'history.changedBy',
                select: 'name avatar'
            })
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        next(error);
    }
};

// Get department tickets (for managers)
export const getDepartmentTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const managerId = req.user._id;
        const manager = await User.findById(managerId);

        if (!manager) {
            return res.status(403).json({ message: 'User not found' });
        }



        let records;

        // If user is admin/superuser without department, show all tickets
        if (!manager.departmentId && (manager.role === 'admin' || manager.role === 'superuser')) {
            records = await MaintenanceRecord.find({})
                .populate('asset', 'name serial department departmentId')
                .populate('requestedBy', 'name email department')
                .populate('processedBy', 'name')
                .populate('technician', 'name email')
                .populate({
                    path: 'history.changedBy',
                    select: 'name avatar'
                })
                .sort({ createdAt: -1 });
        } else if (manager.departmentId) {
            // Find all users in the same department
            const departmentUsers = await User.find({ departmentId: manager.departmentId }).select('_id');
            const userIds = departmentUsers.map(u => u._id);

            // Find all assets in the same department
            const departmentAssets = await Asset.find({ departmentId: manager.departmentId }).select('_id');
            const assetIds = departmentAssets.map(a => a._id);

            // Get tickets from those users OR assigned to this department OR for assets in this department
            records = await MaintenanceRecord.find({
                $or: [
                    { requestedBy: { $in: userIds } },
                    { assignedDepartment: manager.departmentId },
                    { asset: { $in: assetIds } }
                ]
            })
                .populate('asset', 'name serial department departmentId')
                .populate('requestedBy', 'name email')
                .populate('processedBy', 'name')
                .populate('technician', 'name email')
                .populate('assignedDepartment', 'name')
                .populate({
                    path: 'history.changedBy',
                    select: 'name avatar'
                })
                .sort({ createdAt: -1 });
        } else {
            // If manager has no department assigned, return empty list instead of error
            // This prevents UI errors for unassigned managers
            records = [];
        }

        res.json(records);
    } catch (error) {
        next(error);
    }
};

// Create ticket (user must have asset assigned to them, except superuser/admin)
export const createMaintenanceTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        const { asset: assetId } = req.body;

        // Superuser and admin can access all assets
        const isPrivileged = userRole === 'superuser' || userRole === 'admin';

        if (!isPrivileged) {
            // Check if asset is assigned to this user
            const assignment = await Assignment.findOne({
                assetId,
                userId,
                status: 'assigned'
            });

            if (!assignment) {
                return res.status(403).json({
                    message: 'You can only request maintenance for assets assigned to you'
                });
            }
        }

        // Handle file uploads
        let beforePhotos: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            beforePhotos = (req.files as Express.Multer.File[]).map(file => file.path);
        }

        if (req.body.technician === '') delete req.body.technician;
        if (req.body.vendor === '') delete req.body.vendor;

        const record = new MaintenanceRecord({
            ...req.body,
            requestedBy: userId,
            requestedAt: new Date(),
            status: 'Draft',
            beforePhotos: beforePhotos,
            history: [{
                status: 'Draft',
                changedBy: userId,
                changedAt: new Date(),
                notes: 'Ticket created in draft'
            }]
        });
        await record.save();

        // Update asset status
        await Asset.findByIdAndUpdate(assetId, { status: 'request maintenance' });
        // Sync Assignment: active -> maintenance
        await Assignment.findOneAndUpdate({ assetId, status: 'assigned' }, { status: 'maintenance' });

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name email');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// Create maintenance record (admin - bypass ownership check)
export const createMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.body.technician === '') delete req.body.technician;
        if (req.body.vendor === '') delete req.body.vendor;

        const record = new MaintenanceRecord({
            ...req.body,
            requestedBy: req.body.requestedBy || req.user._id,
            requestedAt: new Date(),
            history: [{
                status: req.body.status || 'Draft',
                changedBy: req.body.requestedBy || req.user._id,
                changedAt: new Date(),
                notes: 'Ticket created directly by admin/manager'
            }]
        });
        await record.save();

        if (req.body.asset) {
            await Asset.findByIdAndUpdate(req.body.asset, { status: 'request maintenance' });
            await Assignment.findOneAndUpdate({ assetId: req.body.asset, status: 'assigned' }, { status: 'maintenance' });
        }

        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
};

// Accept ticket and assign technician (manager/admin)
export const acceptTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { technicianId, type } = req.body;
        const managerId = req.user._id;

        if (!technicianId) {
            return res.status(400).json({ message: 'Technician is required' });
        }

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (record.status !== 'Sent') {
            return res.status(400).json({ message: 'Only sent tickets can be accepted' });
        }

        record.technician = technicianId;
        record.processedBy = managerId;
        record.processedAt = new Date();
        if (type) {
            record.type = type;
        }

        record.history.push({
            status: 'Accepted',
            changedBy: managerId,
            changedAt: new Date(),
            notes: `Ticket accepted and assigned to technician. Type set to ${type || record.type}`
        });

        await record.save();

        // Update asset status
        await Asset.findByIdAndUpdate(record.asset, { status: 'maintenance' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'assigned' }, { status: 'maintenance' });

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name email')
            .populate('processedBy', 'name')
            .populate('technician', 'name email');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Start work on ticket (technician)
export const startTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const technicianId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (req.user.role !== 'admin' && req.user.role !== 'superuser' && record.technician?.toString() !== technicianId.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this ticket' });
        }

        const validStatuses = ['Accepted', 'Pending', 'Draft', 'Sent'];
        if (!validStatuses.includes(record.status)) {
            return res.status(400).json({ message: 'Ticket cannot be started from current status' });
        }

        record.status = 'In Progress';

        // FIX: Ensure asset status is 'maintenance' when work starts
        await Asset.findByIdAndUpdate(record.asset, { status: 'maintenance' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'assigned' }, { status: 'maintenance' });

        record.history.push({
            status: 'In Progress',
            changedBy: technicianId,
            changedAt: new Date(),
            notes: 'Technician started work'
        });

        await record.save();

        res.json(record);
    } catch (error) {
        next(error);
    }
};

// Escalate ticket to another department
export const escalateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { departmentId, notes } = req.body;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        record.assignedDepartment = departmentId;
        record.status = 'Escalated';

        // FIX: Ensure asset status is 'maintenance' or 'request maintenance'
        await Asset.findByIdAndUpdate(record.asset, { status: 'maintenance' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'assigned' }, { status: 'maintenance' });

        // Optional: clear technician if escalating moves it out of their queue, 
        // but user might want to keep track. Let's keep it or clear it depending on logic.
        // Usually escalation goes to a manager of that dept.
        record.technician = undefined;

        record.history.push({
            status: 'Escalated',
            changedBy: userId,
            changedAt: new Date(),
            notes: notes || 'Ticket escalated to another department'
        });

        await record.save();
        res.json(record);
    } catch (error) {
        next(error);
    }
};

// Update ticket status (generic) including Pending/External Service
export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        record.status = status;
        if (notes) {
            record.pendingNote = notes; // or just history note
        }

        record.history.push({
            status: status,
            changedBy: userId,
            changedAt: new Date(),
            notes: notes
        });

        await record.save();

        // If ticket is closed/done/cancelled/rejected, set asset status to active
        // If ticket is in progress/accepted/sent, set asset status to maintenance
        const assetId = typeof record.asset === 'object' ? (record.asset as any)._id : record.asset;

        if (['Done', 'Closed', 'Cancelled', 'Rejected'].includes(status)) {
            console.log(`[Maintenance] Maintenance ended (${status}), setting asset ${assetId} to active`);
            await Asset.findByIdAndUpdate(assetId, { status: 'active' });
            await Assignment.findOneAndUpdate({ assetId, status: 'maintenance' }, { status: 'assigned' });
        } else if (['In Progress', 'Accepted', 'Sent', 'Pending'].includes(status)) {
            console.log(`[Maintenance] Maintenance active (${status}), setting asset ${assetId} to maintenance`);
            await Asset.findByIdAndUpdate(assetId, { status: 'maintenance' });
            await Assignment.findOneAndUpdate({ assetId, status: 'assigned' }, { status: 'maintenance' });
        }

        res.json(record);
    } catch (error) {
        console.error("Error updating ticket status:", error);
        next(error);
    }
};

// Reject ticket (manager)
export const rejectTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const managerId = req.user._id;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (record.status !== 'Pending') {
            return res.status(400).json({ message: 'Only pending tickets can be rejected' });
        }

        record.status = 'Rejected';
        record.rejectionReason = reason;
        record.processedBy = managerId;
        record.processedAt = new Date();

        record.history.push({
            status: 'Rejected',
            changedBy: managerId,
            changedAt: new Date(),
            notes: `Rejection reason: ${reason}`
        });

        await record.save();

        // Restore asset status
        // FIX: Use 'active' to be consistent with user request
        await Asset.findByIdAndUpdate(record.asset, { status: 'active' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'maintenance' }, { status: 'assigned' });

        res.json(record);
    } catch (error) {
        next(error);
    }
};

// Complete ticket (manager)
export const completeTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const managerId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (record.status !== 'In Progress') {
            return res.status(400).json({ message: 'Only in-progress tickets can be completed' });
        }

        record.status = 'Done';
        if (!record.processedBy) {
            record.processedBy = managerId;
            record.processedAt = new Date();
        }

        record.history.push({
            status: 'Done',
            changedBy: managerId,
            changedAt: new Date(),
            notes: 'Work completed'
        });

        await record.save();

        // Update asset status to active and add history
        // Update asset status to active and add history
        await Asset.findByIdAndUpdate(record.asset, {
            status: 'active',
            $push: {
                maintenanceHistory: {
                    ticketId: record._id,
                    ticketNumber: record.ticketNumber,
                    description: record.title + (record.description ? `: ${record.description}` : ''),
                    completedBy: managerId,
                    cost: record.cost || 0,
                    completedAt: new Date()
                }
            }
        });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'maintenance' }, { status: 'assigned' });

        res.json(record);
    } catch (error) {
        next(error);
    }
};

// Cancel ticket (user - only their own pending tickets)
export const cancelTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (record.requestedBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only cancel your own tickets' });
        }

        if (record.status !== 'Draft' && record.status !== 'Pending') {
            return res.status(400).json({ message: 'Only draft or pending tickets can be cancelled' });
        }

        record.status = 'Cancelled';

        record.history.push({
            status: 'Cancelled',
            changedBy: userId,
            changedAt: new Date(),
            notes: 'Cancelled by user'
        });

        await record.save();

        // Restore asset status
        // FIX: Use 'active' to be consistent with user request
        await Asset.findByIdAndUpdate(record.asset, { status: 'active' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'maintenance' }, { status: 'assigned' });

        res.json(record);
    } catch (error) {
        next(error);
    }
};

// Send ticket (user - change from Draft to Sent)
export const sendTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (record.requestedBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'You can only send your own tickets' });
        }

        if (record.status !== 'Draft') {
            return res.status(400).json({ message: 'Only draft tickets can be sent' });
        }

        record.status = 'Sent';

        record.history.push({
            status: 'Sent',
            changedBy: userId,
            changedAt: new Date(),
            notes: 'Ticket sent to department'
        });

        await record.save();

        // Update asset status
        await Asset.findByIdAndUpdate(record.asset, { status: 'request maintenance' });
        await Assignment.findOneAndUpdate({ assetId: record.asset, status: 'assigned' }, { status: 'maintenance' });

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial')
            .populate('requestedBy', 'name email');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

export const updateMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log(`[Maintenance] Update Request for ${req.params.id}:`, req.body);
        const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }

        console.log(`[Maintenance] Updated Record:`, {
            id: record._id,
            status: record.status,
            asset: record.asset
        });

        // If status is updated, sync asset status
        if (req.body.status) {
            const assetId = typeof record.asset === 'object' ? (record.asset as any)._id : record.asset;

            if (['Done', 'Closed', 'Cancelled', 'Rejected'].includes(req.body.status)) {
                console.log(`[Maintenance] Maintenance ended (${req.body.status}), setting asset ${assetId} to active`);
                await Asset.findByIdAndUpdate(assetId, { status: 'active' });
                await Assignment.findOneAndUpdate({ assetId, status: 'maintenance' }, { status: 'assigned' });
            } else if (['In Progress', 'Accepted', 'Sent', 'Pending'].includes(req.body.status)) {
                console.log(`[Maintenance] Maintenance active (${req.body.status}), setting asset ${assetId} to maintenance`);
                await Asset.findByIdAndUpdate(assetId, { status: 'maintenance' });
                await Assignment.findOneAndUpdate({ assetId, status: 'assigned' }, { status: 'maintenance' });
            }
        }

        res.json(record);
    } catch (error) {
        console.error("Error updating maintenance record:", error);
        next(error);
    }
};

export const getMaintenanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeRepairs = await MaintenanceRecord.countDocuments({ status: 'In Progress' });
        const pending = await MaintenanceRecord.countDocuments({ status: 'Pending' });
        const completed = await MaintenanceRecord.countDocuments({ status: 'Done' });
        const rejected = await MaintenanceRecord.countDocuments({ status: 'Rejected' });

        res.json({
            activeRepairs,
            pending,
            completed,
            rejected
        });
    } catch (error) {
        next(error);
    }
};

export const deleteMaintenanceRecord = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Remove supply from ticket (technician/admin)
export const removeSupplyFromTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, supplyItemId } = req.params;
        const technicianId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Allow manager/admin/assigned technician
        const isManager = req.user.role === 'admin' || req.user.role === 'superuser' || (req.user.departmentId && req.user.role === 'manager');
        if (record.technician?.toString() !== technicianId.toString() && !isManager) {
            return res.status(403).json({ message: 'You are not assigned to this ticket' });
        }

        // Find supply in record
        const supplyEntryIndex = record.suppliesUsed.findIndex((s: any) => s._id.toString() === supplyItemId);
        if (supplyEntryIndex === -1) {
            return res.status(404).json({ message: 'Supply entry not found in ticket' });
        }

        const supplyEntry = record.suppliesUsed[supplyEntryIndex];

        // Restore stock
        const supply = await Supply.findById(supplyEntry.supply);
        if (supply) {
            supply.quantity += supplyEntry.quantity;
            await supply.save();
        }

        // Remove from record
        record.cost = (record.cost || 0) - (supplyEntry.cost * supplyEntry.quantity);
        if (record.cost < 0) record.cost = 0;

        record.suppliesUsed.splice(supplyEntryIndex, 1);

        record.history.push({
            status: record.status,
            changedBy: technicianId,
            changedAt: new Date(),
            notes: `Removed supply: ${supplyEntry.name} x${supplyEntry.quantity}`
        });

        await record.save();

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name email')
            .populate('suppliesUsed.supply', 'name unit partNumber');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Add note to ticket
export const addMaintenanceNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        record.notes.push({
            content,
            addedBy: userId,
            createdAt: new Date()
        });

        await record.save();

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name email')
            .populate('suppliesUsed.supply', 'name unit partNumber')
            .populate('notes.addedBy', 'name avatar');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Delete note from ticket
export const deleteMaintenanceNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, noteId } = req.params;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const noteIndex = record.notes.findIndex((n: any) => n._id.toString() === noteId);
        if (noteIndex === -1) {
            return res.status(404).json({ message: 'Note not found' });
        }

        // Check ownership (only creator or admin can delete)
        const note = record.notes[noteIndex];
        if (note.addedBy.toString() !== userId.toString() && req.user.role !== 'admin' && req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        record.notes.splice(noteIndex, 1);
        await record.save();

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name email')
            .populate('suppliesUsed.supply', 'name unit partNumber')
            .populate('notes.addedBy', 'name avatar');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Update note (optional, but good for completeness)
export const updateMaintenanceNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, noteId } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const note = record.notes.find((n: any) => n._id.toString() === noteId);
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        if (note.addedBy.toString() !== userId.toString() && req.user.role !== 'admin' && req.user.role !== 'superuser') {
            return res.status(403).json({ message: 'Not authorized to update this note' });
        }

        note.content = content;
        note.updatedAt = new Date();

        await record.save();

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name email')
            .populate('suppliesUsed.supply', 'name unit partNumber')
            .populate('notes.addedBy', 'name avatar');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Get navigation counts for badges
export const getNavCounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let pendingDeptTickets = 0;
        let assignedTickets = 0;
        let activeTickets = 0;
        let pendingUserAction = 0;

        // Count pending department tickets (Sent status)
        if (user.role === 'admin' || user.role === 'superuser') {
            // Admins see all sent tickets
            pendingDeptTickets = await MaintenanceRecord.countDocuments({ status: 'Sent' });

            // Active tickets for admins (Accepted + In Progress)
            activeTickets = await MaintenanceRecord.countDocuments({
                status: { $in: ['Accepted', 'In Progress'] }
            });
        } else if (user.departmentId && (user.role === 'manager' || user.role === 'technician')) {
            // Managers/Technicians see tickets from their department
            const departmentUsers = await User.find({ departmentId: user.departmentId }).select('_id');
            const userIds = departmentUsers.map(u => u._id);
            pendingDeptTickets = await MaintenanceRecord.countDocuments({
                status: 'Sent',
                requestedBy: { $in: userIds }
            });

            // Active tickets for managers (Accepted + In Progress for their dept)
            if (user.role === 'manager') {
                activeTickets = await MaintenanceRecord.countDocuments({
                    status: { $in: ['Accepted', 'In Progress'] },
                    requestedBy: { $in: userIds }
                });
            }
        }

        // Count assigned tickets for technicians (Accepted status, ready to work)
        if (user.role === 'technician') {
            assignedTickets = await MaintenanceRecord.countDocuments({
                technician: userId,
                status: { $in: ['Accepted'] } // Count 'Accepted' as new/actionable.
            });
        }

        // Count pending actions for all users (tickets waiting for their input)
        pendingUserAction = await MaintenanceRecord.countDocuments({
            requestedBy: userId,
            status: 'Pending'
        });

        res.json({
            pendingDeptTickets,
            assignedTickets,
            activeTickets,
            pendingUserAction
        });
    } catch (error) {
        next(error);
    }
};

// Update ticket work details (technician)
export const updateTicketWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const technicianId = req.user._id;
        const { status, beforePhotos, afterPhotos, suppliesUsed, pendingNote, notes } = req.body;




        const record = await MaintenanceRecord.findById(id);
        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Allow manager/admin to update as well, or just the assigned technician
        const isManager = req.user.role === 'admin' || req.user.role === 'superuser' || (req.user.departmentId && req.user.role === 'manager');
        if (record.technician?.toString() !== technicianId.toString() && !isManager) {
            return res.status(403).json({ message: 'You are not assigned to this ticket' });
        }

        // Handle file uploads
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            if (files.beforePhotos) {
                const newPhotos = files.beforePhotos.map(f => f.path);
                // Append or replace? Usually append new ones. 
                // But if we want to support removing old ones via UI, that logic is separate (usually separate delete call or passing list of kept URLs).
                // For this modal which adds *new* photos, we append.
                record.beforePhotos = [...(record.beforePhotos || []), ...newPhotos];
            }

            if (files.afterPhotos) {
                const newPhotos = files.afterPhotos.map(f => f.path);
                record.afterPhotos = [...(record.afterPhotos || []), ...newPhotos];
            }
        } else {
            // If just sending URLs (legacy/mock) or reusing existing
            if (beforePhotos && Array.isArray(beforePhotos)) record.beforePhotos = beforePhotos;
            if (afterPhotos && Array.isArray(afterPhotos)) record.afterPhotos = afterPhotos;
        }

        if (pendingNote) record.pendingNote = pendingNote;

        // Handle supplies
        // Parse if string (multipary/form-data sends complex objects as strings)
        let suppliesData = suppliesUsed;
        if (typeof suppliesUsed === 'string') {
            try {
                suppliesData = JSON.parse(suppliesUsed);
            } catch (e) {
                console.error('Failed to parse suppliesUsed', e);
            }
        }

        if (suppliesData && Array.isArray(suppliesData)) {
            // Revert previous supplies if we are replacing the list (or handle differential updates - here we assume we append or replace via UI logic. 
            // For simplicity in this iteration, let's assume we are receiving the *new* supplies to add, or the full list.
            // A safer approach for stock management is to handle "adding" supplies specifically.
            // Let's assume the UI sends the NEW items to add to the existing list to avoid complex diffing on the backend for this iteration, 
            // OR we can just loop through and reduce stock for *newly added* items.

            // BETTER APPROACH: The UI should send the supplies to ADD. 
            // But if we want to support full form submission:
            // We will loop through the incoming suppliesUsed. match with existing. 
            // If it's a new entry (no ID check, but just structurally), deduct stock.
            // To keep it robust, let's assume the frontend sends the "delta" or we just append.

            // For this Implementation: We will APPEND the new supplies sent in the body to the existing array.
            // so req.body.suppliesUsed should contain ONLY the new supplies to add.

            for (const item of suppliesData) {
                const supply = await Supply.findById(item.supply);
                if (supply) {
                    if (supply.quantity < item.quantity) {
                        return res.status(400).json({ message: `Insufficient stock for ${supply.name}` });
                    }
                    // Deduct stock
                    supply.quantity -= item.quantity;
                    await supply.save();

                    // Add to record
                    record.suppliesUsed.push({
                        supply: item.supply,
                        quantity: item.quantity,
                        name: supply.name,
                        cost: supply.cost
                    });
                    // Update total cost
                    record.cost = (record.cost || 0) + (supply.cost * item.quantity);
                }
            }
        }

        // Handle Status Changes
        if (status && status !== record.status) {
            record.status = status;

            const historyEntry: any = {
                status: status,
                changedBy: technicianId,
                changedAt: new Date(),
                notes: notes || `Status updated to ${status}`
            };

            if (status === 'Pending' && pendingNote) {
                historyEntry.notes = `Pending: ${pendingNote}`;
            } else if (status === 'External Service') {
                historyEntry.notes = 'Requested external service';
            } else if (status === 'Done') {
                historyEntry.notes = 'Work completed';
                // Ensure processedBy is set if not already
                if (!record.processedBy) record.processedBy = technicianId;
            }

            record.history.push(historyEntry);
        }

        await record.save();

        const populated = await MaintenanceRecord.findById(record._id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email')
            .populate('technician', 'name email')
            .populate('suppliesUsed.supply', 'name unit partNumber');

        res.json(populated);
    } catch (error) {
        next(error);
    }
};

// Get single ticket by ID
export const getMaintenanceTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const record = await MaintenanceRecord.findById(req.params.id)
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email department')
            .populate('technician', 'name email')
            .populate('processedBy', 'name')
            .populate('suppliesUsed.supply', 'name unit partNumber')
            .populate({
                path: 'history.changedBy',
                select: 'name avatar'
            })
            .populate('notes.addedBy', 'name avatar');

        if (!record) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(record);
    } catch (error) {
        next(error);
    }
};
