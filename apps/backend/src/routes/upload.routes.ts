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
        fileSize: 50 * 1024 * 1024 // 50MB limit
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
router.post('/', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer Middleware Error:', err);

            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({ message: 'File is too large. Maximum size is 50MB.' });
                }
                return res.status(400).json({ message: err.message });
            }

            // Other errors (e.g. fileFilter)
            return res.status(400).json({ message: (err as Error).message });
        }

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
            console.error('Route Handler Error:', error);
            res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
        }
    });
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

// Route: DELETE /api/v1/upload/:filename
router.delete('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.resolve(process.cwd(), 'uploads', filename);

        // Security check: ensure the resolved path is within the uploads directory
        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        if (!filepath.startsWith(uploadsDir)) {
            return res.status(403).json({ message: 'Invalid file path' });
        }

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            res.status(200).json({ message: 'File deleted successfully' });
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    } catch (error) {
        console.error('Delete File Error', error);
        res.status(500).json({ message: 'Failed to delete file', error: (error as Error).message });
    }
});

export default router;
