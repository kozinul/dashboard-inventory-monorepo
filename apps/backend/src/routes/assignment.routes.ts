
import express from 'express';
import {
    createAssignment,
    returnAsset,
    getUserAssignments,
    getAssetHistory,
    getAllAssignments,
    deleteAssignment,
    updateAssignment,
    bulkUpdateRecipient,
    bulkDeleteRecipient
} from '../controllers/assignment.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createAssignment);
router.post('/bulk-update', bulkUpdateRecipient);
router.post('/bulk-delete', bulkDeleteRecipient);
router.get('/', getAllAssignments);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);
router.put('/:id/return', returnAsset);
router.get('/user/:userId', getUserAssignments);
router.get('/asset/:assetId', getAssetHistory);

export default router;
