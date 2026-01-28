import express from 'express';
import {
    getBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup
} from '../controllers/database.controller.js';

const router = express.Router();

router.route('/')
    .get(getBackups)
    .post(createBackup);

router.post('/:filename/restore', restoreBackup);
router.delete('/:filename', deleteBackup);
router.get('/:filename/download', downloadBackup);

export default router;
