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
        // Sanitize filename to prevent path traversal via upload
        const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, safeName);
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

// All database routes require superuser/system_admin auth
router.use(protect, authorize('superuser', 'system_admin'));

router.route('/')
    .get(getBackups)
    .post(createBackup);

router.post('/upload', upload.single('backupFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or invalid file type' });
    }
    res.json({ message: 'Backup uploaded successfully', filename: req.file.filename });
});

// Path traversal protection middleware for :filename routes
const validateFilename = (req: any, res: any, next: any) => {
    const filename = req.params.filename;
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename' });
    }
    next();
};

router.post('/:filename/restore', validateFilename, restoreBackup);
router.delete('/:filename', validateFilename, deleteBackup);
router.get('/:filename/download', validateFilename, downloadBackup);
router.delete('/reset-transactions', resetTransactions);

export default router;
