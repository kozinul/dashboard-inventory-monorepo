import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuration for local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use path.resolve to be absolutely sure of the path
        const uploadPath = path.resolve(process.cwd(), 'uploads');
        try {
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
                console.log(`Created upload directory at: ${uploadPath}`);
            }
            cb(null, uploadPath);
        } catch (err) {
            console.error(`Failed to create upload directory: ${err}`);
            cb(err as Error, '');
        }
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-random-originalExt
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Basic filter, can be improved to check magic numbers
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Route: POST /api/v1/upload
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Return the accessible URL for the file
        // Assuming static serve at /uploads
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        res.status(201).json({
            message: 'File uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
    }
});

// Route: POST /api/v1/upload/multiple
router.post('/multiple', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const files = req.files as Express.Multer.File[];
        const urls = files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);

        res.status(201).json({
            message: 'Files uploaded successfully',
            data: {
                urls: urls
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
    }
});

export default router;
