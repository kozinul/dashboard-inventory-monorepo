
import express from 'express';
import {
    createAssignment,
    returnAsset,
    getUserAssignments,
    getAssetHistory
} from '../controllers/assignment.controller.js';

const router = express.Router();

router.post('/', createAssignment);
router.put('/:id/return', returnAsset);
router.get('/user/:userId', getUserAssignments);
router.get('/asset/:assetId', getAssetHistory);

export default router;
