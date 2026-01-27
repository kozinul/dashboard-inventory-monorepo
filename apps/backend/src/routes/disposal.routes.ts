import express from 'express';
import {
    getDisposalRecords,
    createDisposalRecord,
    updateDisposalStatus,
    getDisposalStats
} from '../controllers/disposal.controller.js';

const router = express.Router();

router.get('/', getDisposalRecords);
router.post('/', createDisposalRecord);
router.put('/:id', updateDisposalStatus);
router.get('/stats', getDisposalStats);

export default router;
