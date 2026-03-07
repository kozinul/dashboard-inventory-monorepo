import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/permission.middleware.js';
import { convertJsonToExcel } from '../controllers/tools.controller.js';

const router = Router();

// Configure multer for memory storage (we just need the buffer to parse JSON)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    }
});

// Route for converting multiple JSON files to an Excel file (with Autofix)
router.post(
    '/convert-json',
    protect,
    checkPermission('tools', 'create'), // Ensure only authorized roles can access this
    upload.array('files', 50), // Accept up to 50 files
    convertJsonToExcel
);

export default router;
