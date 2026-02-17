import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { Transfer } from '../models/transfer.model.js';
import { Disposal } from '../models/disposal.model.js';
import { Assignment } from '../models/assignment.model.js';
import { Rental } from '../models/rental.model.js';
import { Event } from '../models/event.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Asset } from '../models/asset.model.js';

dotenv.config();

const resetTransactions = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Delete Transactional Data
        console.log('Deleting Maintenance Records...');
        await MaintenanceRecord.deleteMany({});

        console.log('Deleting Transfers...');
        await Transfer.deleteMany({});

        console.log('Deleting Disposals...');
        await Disposal.deleteMany({});

        console.log('Deleting Assignments...');
        await Assignment.deleteMany({});

        console.log('Deleting Rentals...');
        await Rental.deleteMany({});

        console.log('Deleting Events...');
        await Event.deleteMany({});

        console.log('Deleting Supply History...');
        await SupplyHistory.deleteMany({});

        // Reset Assets
        console.log('Resetting Asset Statuses...');
        await Asset.updateMany({}, {
            $set: {
                status: 'Active',
                assignedTo: null,
                assignedToType: null,
                nextMaintenanceDate: null
            }
        });

        console.log('Database transactions reset successfully!');
        process.exit();
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetTransactions();
