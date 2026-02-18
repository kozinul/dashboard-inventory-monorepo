import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { Transfer } from '../models/transfer.model.js';
import { DisposalRecord as Disposal } from '../models/disposal.model.js';
import { Assignment } from '../models/assignment.model.js';
import Rental from '../models/rental.model.js';
import Event from '../models/event.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Asset } from '../models/asset.model.js';
import { AssetTemplate } from '../models/assetTemplate.model.js';
import { Branch } from '../models/branch.model.js';
import { Category } from '../models/category.model.js';
import { Department } from '../models/department.model.js';
import { JobTitle } from '../models/jobTitle.model.js';
import { Location } from '../models/location.model.js';
import { LocationType } from '../models/locationType.model.js';
import { Supply } from '../models/supply.model.js';
import { Unit } from '../models/unit.model.js';
import { User } from '../models/user.model.js';
import { Vendor } from '../models/vendor.model.js';
import { Notification } from '../models/notification.model.js';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const getTimestamp = () => {
    return new Date().toISOString().replace(/[:.]/g, '-');
};

export const getBackups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR).filter(file => file.endsWith('.json'));
        const backups = files.map(file => {
            const stats = fs.statSync(path.join(BACKUP_DIR, file));
            return {
                filename: file,
                size: stats.size,
                createdAt: stats.birthtime
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        res.json({
            success: true,
            data: backups
        });
    } catch (error) {
        next(error);
    }
};

export const createBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const timestamp = getTimestamp();
        const filename = `backup-${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        const data = {
            users: await User.find({}),
            assets: await Asset.find({}),
            assetTemplates: await AssetTemplate.find({}),
            branches: await Branch.find({}),
            categories: await Category.find({}),
            departments: await Department.find({}),
            jobTitles: await JobTitle.find({}),
            locations: await Location.find({}),
            locationTypes: await LocationType.find({}),
            supplies: await Supply.find({}),
            units: await Unit.find({}),
            vendors: await Vendor.find({}),
            maintenanceRecords: await MaintenanceRecord.find({}),
            transfers: await Transfer.find({}),
            disposals: await Disposal.find({}),
            assignments: await Assignment.find({}),
            rentals: await Rental.find({}),
            events: await Event.find({}),
            supplyHistory: await SupplyHistory.find({}),
            // notifications: await Notification.find({})
        };

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        res.json({
            success: true,
            message: 'Backup created successfully',
            filename
        });
    } catch (error) {
        next(error);
    }
};

export const restoreBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            res.status(404);
            throw new Error('Backup file not found');
        }

        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Asset.deleteMany({}),
            AssetTemplate.deleteMany({}),
            Branch.deleteMany({}),
            Category.deleteMany({}),
            Department.deleteMany({}),
            JobTitle.deleteMany({}),
            Location.deleteMany({}),
            LocationType.deleteMany({}),
            Supply.deleteMany({}),
            Unit.deleteMany({}),
            Vendor.deleteMany({}),
            MaintenanceRecord.deleteMany({}),
            Transfer.deleteMany({}),
            Disposal.deleteMany({}),
            Assignment.deleteMany({}),
            Rental.deleteMany({}),
            Event.deleteMany({}),
            SupplyHistory.deleteMany({}),
            // Notification.deleteMany({})
        ]);

        // Restore data
        if (data.users?.length) await User.insertMany(data.users);
        if (data.assets?.length) await Asset.insertMany(data.assets);
        if (data.assetTemplates?.length) await AssetTemplate.insertMany(data.assetTemplates);
        if (data.branches?.length) await Branch.insertMany(data.branches);
        if (data.categories?.length) await Category.insertMany(data.categories);
        if (data.departments?.length) await Department.insertMany(data.departments);
        if (data.jobTitles?.length) await JobTitle.insertMany(data.jobTitles);
        if (data.locations?.length) await Location.insertMany(data.locations);
        if (data.locationTypes?.length) await LocationType.insertMany(data.locationTypes);
        if (data.supplies?.length) await Supply.insertMany(data.supplies);
        if (data.units?.length) await Unit.insertMany(data.units);
        if (data.vendors?.length) await Vendor.insertMany(data.vendors);
        if (data.maintenanceRecords?.length) await MaintenanceRecord.insertMany(data.maintenanceRecords);
        if (data.transfers?.length) await Transfer.insertMany(data.transfers);
        if (data.disposals?.length) await Disposal.insertMany(data.disposals);
        if (data.assignments?.length) await Assignment.insertMany(data.assignments);
        if (data.rentals?.length) await Rental.insertMany(data.rentals);
        if (data.events?.length) await Event.insertMany(data.events);
        if (data.supplyHistory?.length) await SupplyHistory.insertMany(data.supplyHistory);

        res.json({
            success: true,
            message: 'Database restored successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        res.json({
            success: true,
            message: 'Backup deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export const downloadBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filename } = req.params;
        const filepath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filepath)) {
            res.status(404);
            throw new Error('Backup file not found');
        }

        res.download(filepath);
    } catch (error) {
        next(error);
    }
};

export const resetTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Double check authorization (though middleware handles it)
        if (req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
            res.status(403);
            throw new Error('Not authorized to perform this dangerous action');
        }

        console.log(`Database reset initiated by ${req.user.email}`);

        // Delete Transactional Data
        await Promise.all([
            MaintenanceRecord.deleteMany({}),
            Transfer.deleteMany({}),
            Disposal.deleteMany({}),
            Assignment.deleteMany({}),
            Rental.deleteMany({}),
            Event.deleteMany({}),
            SupplyHistory.deleteMany({}),
            Asset.deleteMany({}), // Assets are inventory/transactional
            Supply.deleteMany({}), // Supplies are inventory/transactional
            // Notification.deleteMany({}),
            // AuditLog.deleteMany({}) 
        ]);

        // Note: Masterdata (Branches, Departments, Users, etc.) are PRESERVED

        console.log(`Database reset completed successfully by ${req.user.email}`);

        res.json({ message: 'System transactional data reset successfully. Masterdata preserved.' });
    } catch (error) {
        next(error);
    }
};
