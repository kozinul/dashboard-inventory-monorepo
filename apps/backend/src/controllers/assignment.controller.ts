
import { Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/assignment.model.js';
import { Asset } from '../models/asset.model.js';

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId, userId, assignedTo, assignedToTitle, locationId, notes, assignedDate } = req.body;

        // Validation: Either userId OR assignedTo must be present
        if (!userId && !assignedTo) {
            res.status(400);
            throw new Error('Either a registered User or a manual Recipient Name is required');
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
            // Ideally fetch location name too, but for now ID is critical.
            // If we have Location model imported, we could fetch it.
            // keeping it simple to just ID for now or assuming frontend sends name if needed, 
            // but model generally uses ID ref.
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
        const assignments = await Assignment.find({ isDeleted: { $ne: true } })
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
