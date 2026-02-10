
import { Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/assignment.model.js';
import { Asset } from '../models/asset.model.js';
import { User } from '../models/user.model.js';

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId, userId, assignedTo, assignedToTitle, locationId, notes, assignedDate } = req.body;

        // Validation: Either userId OR assignedTo must be present
        if (!userId && !assignedTo) {
            res.status(400);
            throw new Error('Either a registered User or a manual Recipient Name is required');
        }

        // RBAC: Check if user can assign this asset (department check)
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const asset = await Asset.findById(assetId);
            if (!asset || asset.departmentId?.toString() !== req.user.departmentId?.toString()) {
                res.status(403);
                throw new Error('You can only assign assets from your department');
            }
        }

        // Sanitize userId -> if empty string, make it null/undefined so Mongoose doesn't error on casting
        const finalUserId = userId || undefined;

        // Check if asset is already assigned
        const activeAssignment = await Assignment.findOne({
            assetId,
            status: { $in: ['assigned', 'maintenance'] }
        });

        if (activeAssignment) {
            res.status(400);
            throw new Error('Asset is already assigned');
        }

        const assignment = await Assignment.create({
            assetId,
            userId: finalUserId,
            assignedTo,
            assignedToTitle,
            locationId,
            notes,
            assignedDate: assignedDate || new Date(),
            status: 'assigned'
        });

        // Update Asset status and Location
        const assetUpdate: any = { status: 'assigned' };

        if (locationId) {
            assetUpdate.locationId = locationId;
        }

        await Asset.findByIdAndUpdate(assetId, assetUpdate);

        // Populate return data
        await assignment.populate(['assetId', 'userId', 'locationId']);

        res.status(201).json(assignment);
    } catch (error) {
        next(error);
    }
};

export const returnAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { returnedDate, notes } = req.body;

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        if (assignment.status === 'returned') {
            res.status(400);
            throw new Error('Asset is already returned');
        }

        assignment.status = 'returned';
        assignment.returnedDate = returnedDate || new Date();
        if (notes) assignment.notes = notes;

        await assignment.save();

        // Update Asset status back to active
        // Assuming assetId is populated or we fetch it. Assignment model has assetId.
        // If not populated, it's an ObjectId.
        // Update Asset status back to active ONLY if not in maintenance
        const asset = await Asset.findById(assignment.assetId);
        if (asset && asset.status !== 'maintenance' && asset.status !== 'request maintenance') {
            await Asset.findByIdAndUpdate(assignment.assetId, { status: 'active' });
        }

        res.json(assignment);
    } catch (error) {
        next(error);
    }
};

export const getUserAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        // RBAC: Check if user can access this user's assignments
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const targetUser = await User.findById(userId);
            if (!targetUser || targetUser.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const assignments = await Assignment.find({ userId })
            .populate('assetId')
            .sort({ assignedDate: -1 });
        res.json(assignments);
    } catch (error) {
        next(error);
    }
};

export const getAssetHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId } = req.params;

        // RBAC: Check if user can access this asset's history
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const asset = await Asset.findById(assetId);
            if (!asset || asset.departmentId?.toString() !== req.user.departmentId?.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        const history = await Assignment.find({ assetId })
            .sort({ assignedDate: -1 })
            .populate('locationId');

        res.json(history);
    } catch (error) {
        next(error);
    }
};

export const getAllAssignments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filter: any = { isDeleted: { $ne: true } };

        // RBAC: Department filtering for non-admin users
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                // Get assets from user's department
                const deptAssets = await Asset.find({ departmentId: req.user.departmentId }).select('_id');
                const assetIds = deptAssets.map(a => a._id);
                filter.assetId = { $in: assetIds };
            } else {
                // No department = no access
                return res.json([]);
            }
        }

        const assignments = await Assignment.find(filter)
            .populate('assetId')
            .populate('userId')
            .populate('locationId')
            .sort({ assignedDate: -1 });
        res.json(assignments);
    } catch (error) {
        next(error);
    }
};

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const assignment = await Assignment.findById(id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        // Release asset if active
        if (assignment.status === 'assigned' || assignment.status === 'maintenance') {
            const asset = await Asset.findById(assignment.assetId);
            if (asset && asset.status !== 'maintenance' && asset.status !== 'request maintenance') {
                await Asset.findByIdAndUpdate(assignment.assetId, { status: 'active' });
            }
            assignment.status = 'returned';
            assignment.returnedDate = new Date();
        }

        assignment.isDeleted = true;
        await assignment.save();

        res.json({ message: 'Assignment removed' });
    } catch (error) {
        next(error);
    }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { assignedTo, assignedToTitle, notes, assignedDate, locationId } = req.body;

        const assignment = await Assignment.findById(id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        // Update fields
        if (assignedTo !== undefined) assignment.assignedTo = assignedTo;
        if (assignedToTitle !== undefined) assignment.assignedToTitle = assignedToTitle;
        if (notes !== undefined) assignment.notes = notes;
        if (assignedDate !== undefined) assignment.assignedDate = assignedDate;

        // Handle location change
        if (locationId && assignment.locationId?.toString() !== locationId) {
            assignment.locationId = locationId;

            // Also update the asset's location to stay in sync
            await Asset.findByIdAndUpdate(assignment.assetId, { locationId });
        }

        await assignment.save();

        // Re-populate to return full object
        await assignment.populate(['assetId', 'userId', 'locationId']);

        res.json(assignment);
    } catch (error) {
        next(error);
    }
};

export const bulkUpdateRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentName, newName, newTitle, newLocationId } = req.body;

        if (!currentName) {
            res.status(400);
            throw new Error('Current recipient name is required');
        }

        // Find all active assignments for this user
        const assignments = await Assignment.find({
            assignedTo: currentName,
            status: 'assigned',
            isDeleted: { $ne: true }
        });

        if (assignments.length === 0) {
            res.status(404);
            throw new Error('No active assignments found for this recipient');
        }

        // Update loop
        const updates = assignments.map(async (assignment) => {
            if (newName) assignment.assignedTo = newName;
            if (newTitle) assignment.assignedToTitle = newTitle;

            if (newLocationId && assignment.locationId?.toString() !== newLocationId) {
                assignment.locationId = newLocationId;
                // Sync asset location
                await Asset.findByIdAndUpdate(assignment.assetId, { locationId: newLocationId });
            }

            return assignment.save();
        });

        await Promise.all(updates);

        res.json({ message: `Updated ${assignments.length} assignments`, count: assignments.length });
    } catch (error) {
        next(error);
    }
};

export const bulkDeleteRecipient = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { currentName } = req.body;

        if (!currentName) {
            res.status(400);
            throw new Error('Recipient name is required');
        }

        // Find all assignments that are NOT already deleted
        const assignments = await Assignment.find({
            assignedTo: currentName,
            isDeleted: { $ne: true }
        });

        if (assignments.length === 0) {
            return res.json({ message: 'No assignments found to delete', count: 0 });
        }

        // Soft delete all
        const updates = assignments.map(async (assignment) => {
            if (assignment.status === 'assigned') {
                await Asset.findByIdAndUpdate(assignment.assetId, { status: 'active' });
                // Mark as returned so history shows it ended
                assignment.status = 'returned';
                assignment.returnedDate = new Date();
            }

            assignment.isDeleted = true;
            return assignment.save();
        });

        await Promise.all(updates);

        res.json({ message: `Deleted ${assignments.length} assignment records`, count: assignments.length });
    } catch (error) {
        next(error);
    }
};
