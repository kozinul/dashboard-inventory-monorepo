import { Request, Response, NextFunction } from 'express';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { Asset } from '../models/asset.model.js';
import { Assignment } from '../models/assignment.model.js';
import { User } from '../models/user.model.js';

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

        const records = await MaintenanceRecord.find(filter)
            .populate('asset', 'name serial')
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
            .populate('asset', 'name serial')
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
            .populate('asset', 'name serial')
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
                .populate('asset', 'name serial')
                .populate('requestedBy', 'name email department')
                .populate('processedBy', 'name')
                .populate({
                    path: 'history.changedBy',
                    select: 'name avatar'
                })
                .sort({ createdAt: -1 });
        } else if (manager.departmentId) {
            // Find all users in the same department
            const departmentUsers = await User.find({ departmentId: manager.departmentId }).select('_id');
            const userIds = departmentUsers.map(u => u._id);

            // Get tickets from those users
            records = await MaintenanceRecord.find({ requestedBy: { $in: userIds } })
                .populate('asset', 'name serial')
                .populate('requestedBy', 'name email')
                .populate('processedBy', 'name')
                .populate({
                    path: 'history.changedBy',
                    select: 'name avatar'
                })
                .sort({ createdAt: -1 });
        } else {
            return res.status(403).json({ message: 'User is not assigned to a department' });
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

        if (req.body.technician === '') delete req.body.technician;
        if (req.body.vendor === '') delete req.body.vendor;

        const record = new MaintenanceRecord({
            ...req.body,
            requestedBy: userId,
            requestedAt: new Date(),
            status: 'Draft',
            history: [{
                status: 'Draft',
                changedBy: userId,
                changedAt: new Date(),
                notes: 'Ticket created in draft'
            }]
        });
        await record.save();

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

        record.status = 'Accepted';
        record.technician = technicianId;
        record.processedBy = managerId;
        record.processedAt = new Date();
        if (type) {
            record.type = type;
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

        if (record.technician?.toString() !== technicianId.toString()) {
            return res.status(403).json({ message: 'You are not assigned to this ticket' });
        }

        if (record.status !== 'Accepted') {
            return res.status(400).json({ message: 'Only accepted tickets can be started' });
        }

        record.status = 'In Progress';
        record.status = 'In Progress';

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
        record.processedAt = new Date();

        record.history.push({
            status: 'Rejected',
            changedBy: managerId,
            changedAt: new Date(),
            notes: `Rejection reason: ${reason}`
        });

        await record.save();

        // Restore asset status
        await Asset.findByIdAndUpdate(record.asset, { status: 'available' });

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
        await Asset.findByIdAndUpdate(record.asset, {
            status: 'active',
            $push: {
                maintenanceHistory: {
                    ticketNumber: record.ticketNumber,
                    description: record.title + (record.description ? `: ${record.description}` : ''),
                    completedBy: managerId,
                    cost: record.cost || 0,
                    completedAt: new Date()
                }
            }
        });

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
        await Asset.findByIdAndUpdate(record.asset, { status: 'available' });

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
        const record = await MaintenanceRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.json(record);
    } catch (error) {
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
