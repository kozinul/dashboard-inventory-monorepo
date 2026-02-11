import express from 'express';
import {
    createTransfer,
    getTransfers,
    approveTransfer,
    rejectTransfer,
    deleteTransfer,
    updateTransfer
} from '../controllers/transfer.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getTransfers);
router.post('/', createTransfer);
router.post('/:id/approve', approveTransfer);
router.post('/:id/reject', rejectTransfer);
router.delete('/:id', deleteTransfer);
router.put('/:id', updateTransfer);

export default router;
