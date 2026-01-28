import { Request, Response, NextFunction } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';

const execPromise = util.promisify(exec);

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const getBackups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = await fs.promises.readdir(BACKUP_DIR);
        const backups = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = await fs.promises.stat(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                };
            })
        );

        // Sort by newest first
        backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.status(200).json({
            success: true,
            data: backups,
        });
    } catch (error) {
        next(error);
    }
};

export const createBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup-${timestamp}.sql`;
        const filePath = path.join(BACKUP_DIR, filename);

        // Get database connection details from environment variables
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL is not defined');
        }

        // Use pg_dump to create backup
        // Note: This relies on pg_dump being available in the system PATH and the user having permissions
        const command = `pg_dump "${dbUrl}" > "${filePath}"`;

        await execPromise(command);

        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: { filename },
        });
    } catch (error) {
        console.error('Backup error:', error);
        next(error);
    }
};

export const restoreBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'Backup file not found' });
            return;
        }

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            throw new Error('DATABASE_URL is not defined');
        }

        // Use psql to restore backup
        // WARNING: This replaces the current database content
        const command = `psql "${dbUrl}" < "${filePath}"`;

        await execPromise(command);

        res.status(200).json({
            success: true,
            message: 'Database restored successfully',
        });
    } catch (error) {
        console.error('Restore error:', error);
        next(error);
    }
};

export const deleteBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'Backup file not found' });
            return;
        }

        await fs.promises.unlink(filePath);

        res.status(200).json({
            success: true,
            message: 'Backup deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const downloadBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, message: 'Backup file not found' });
            return;
        }

        res.download(filePath);
    } catch (error) {
        next(error);
    }
};
