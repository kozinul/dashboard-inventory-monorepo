/**
 * File Validation Utilities
 * Validates file size, type, and prevents duplicates
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate a single file
 */
export const validateFile = (file: File): FileValidationResult => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File "${file.name}" is too large. Maximum size is 5MB.`
        };
    }

    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `File "${file.name}" is not a valid image. Only JPEG, PNG, and WebP are allowed.`
        };
    }

    // Additional check for file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return {
            valid: false,
            error: `File "${file.name}" has an invalid extension. Only .jpg, .jpeg, .png, and .webp are allowed.`
        };
    }

    return { valid: true };
};

/**
 * Validate multiple files
 */
export const validateFiles = (files: File[]): FileValidationResult => {
    for (const file of files) {
        const result = validateFile(file);
        if (!result.valid) {
            return result;
        }
    }
    return { valid: true };
};

/**
 * Check if file is duplicate based on name and size
 */
export const isDuplicateFile = (file: File, existingFiles: File[]): boolean => {
    return existingFiles.some(
        existing => existing.name === file.name && existing.size === file.size
    );
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get human-readable file type
 */
export const getFileTypeName = (file: File): string => {
    const type = file.type.toLowerCase();
    if (type.includes('jpeg') || type.includes('jpg')) return 'JPEG Image';
    if (type.includes('png')) return 'PNG Image';
    if (type.includes('webp')) return 'WebP Image';
    return 'Unknown';
};

export const FILE_VALIDATION_CONSTANTS = {
    MAX_FILE_SIZE,
    MAX_FILE_SIZE_MB: MAX_FILE_SIZE / (1024 * 1024),
    ALLOWED_IMAGE_TYPES,
    ALLOWED_EXTENSIONS
};
