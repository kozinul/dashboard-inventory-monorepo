import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Branch } from './models/branch.model.js';
import { Asset } from './models/asset.model.js';
import { User } from './models/user.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-app';

const seedBranches = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const branches = [
            { name: 'Head Office', code: 'HO', isHeadOffice: true, address: 'Main St, City Center' },
            { name: 'JSO Site', code: 'JSO', isHeadOffice: false, address: 'Industrial Park, Sector 5' },
            { name: 'Grand Hotel', code: 'HTL', isHeadOffice: false, address: 'Beach Road, Resort Area' }
        ];

        let hoId;

        for (const b of branches) {
            const exists = await Branch.findOne({ code: b.code });
            if (!exists) {
                const newBranch = await Branch.create(b);
                console.log(`Created branch: ${b.name}`);
                if (b.code === 'HO') hoId = newBranch._id;
            } else {
                console.log(`Branch already exists: ${b.name}`);
                if (b.code === 'HO') hoId = exists._id;
            }
        }

        // Migration: Assign Head Office to all Users and Assets that don't have a branch
        if (hoId) {
            const usersUpdated = await User.updateMany(
                { branchId: { $exists: false } },
                { $set: { branchId: hoId } }
            );
            console.log(`Updated ${usersUpdated.modifiedCount} users to Head Office.`);

            const assetsUpdated = await Asset.updateMany(
                { branchId: { $exists: false } },
                { $set: { branchId: hoId } }
            );
            console.log(`Updated ${assetsUpdated.modifiedCount} assets to Head Office.`);
        }

        console.log('Branch seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding branches:', error);
        process.exit(1);
    }
};

seedBranches();
