
import { Request, Response, NextFunction } from 'express';
import { Assignment } from '../models/assignment.model.js';
import { Asset } from '../models/asset.model.js';

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { assetId, userId, notes, assignedDate } = req.body;

        // Check if asset is already assigned
        const activeAssignment = await Assignment.findOne({
            assetId,
            status: 'assigned'
        });

        if (activeAssignment) {
            res.status(400);
            throw new Error('Asset is already assigned');
        }

        const assignment = await Assignment.create({
            assetId,
            userId,
            notes,
            assignedDate: assignedDate || new Date(),
            status: 'assigned'
        });

        // Update Asset status (optional but good for quick lookup)
        // We will assume the frontend uses the Assignment collection for status too or we update asset status
        // Let's update the Asset status to 'active' (or keep it active) but maybe we need an 'assigned' status in Asset model?
        // The user prompt said: "jika sudah di assign maka tidak bisa di ambil oleh user lain"
        // Relying on activeAssignment check above is safer.

        // Populate return data
        await assignment.populate(['assetId', 'userId']);

        // Update Asset status
        await Asset.findByIdAndUpdate(assetId, { status: 'assigned' });

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
        await Asset.findByIdAndUpdate(assignment.assetId, { status: 'active' });

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
        const assignments = await Assignment.find({ assetId })
            .populate('userId')
            .sort({ assignedDate: -1 });
        res.json(assignments);
    } catch (error) {
        next(error);
    }
};
