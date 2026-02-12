import express from 'express';
import {
    getDisposalRecords,
    createDisposalRecord,
    updateDisposalStatus,
    getDisposalStats
} from '../controllers/disposal.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getDisposalRecords);
router.post('/', createDisposalRecord);
router.put('/:id', updateDisposalStatus);
router.get('/stats', getDisposalStats);

export default router;
