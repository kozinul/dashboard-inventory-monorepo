import express from 'express';
import multer from 'multer';
import {
    downloadTemplate,
    exportData,
    importData
} from '../controllers/importExport.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Use memory storage for Excel imports
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes are protected
router.use(protect);

router.get('/template', downloadTemplate);
router.get('/export', exportData);
router.post('/import', upload.single('file'), importData);

export default router;
