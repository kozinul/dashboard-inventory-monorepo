import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Handle Zod Validation Errors
    if (err instanceof ZodError) {
        res.status(400).json({
            message: 'Validation Error',
            errors: err.errors,
        });
        return;
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log to file
    const logPath = path.join(process.cwd(), 'error.log');
    const logMessage = `[${new Date().toISOString()}] ${statusCode} - ${err.message}\nStack: ${err.stack}\n\n`;

    try {
        fs.appendFileSync(logPath, logMessage);
    } catch (e) {
        console.error('Failed to write to error log', e);
    }

    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
