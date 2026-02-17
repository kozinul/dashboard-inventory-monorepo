import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getBackups,
    createBackup,
    restoreBackup,
    deleteBackup,
    downloadBackup,
    resetTransactions
} from '../controllers/database.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

const BACKUP_DIR = path.join(process.cwd(), 'backups');
// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, BACKUP_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(null, false); // Fail silently or handle error?
        }
    }
});

router.route('/')
    .get(getBackups)
    .post(createBackup);

router.post('/upload', protect, authorize('superuser', 'system_admin'), upload.single('backupFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    res.json({ message: 'Backup uploaded successfully', filename: req.file.filename });
});

router.post('/:filename/restore', restoreBackup);
router.delete('/:filename', deleteBackup);
router.get('/:filename/download', downloadBackup);
router.delete('/reset-transactions', protect, authorize('superuser', 'system_admin'), resetTransactions);

export default router;
