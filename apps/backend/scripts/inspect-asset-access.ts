import mongoose from 'mongoose';
import { Asset } from '../src/models/asset.model';
import { User } from '../src/models/user.model';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import all models to ensure registration
import '../src/models/department.model';
import '../src/models/branch.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectAccess = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Users to check
        const usernames = ['muaris', 'tony'];

        for (const username of usernames) {
            console.log(`\n--- Inspecting User: ${username} ---`);
            const user = await User.findOne({ username });
            if (!user) {
                console.log('User not found');
                continue;
            }
            console.log(`ID: ${user._id}`);
            console.log(`Role: ${user.role}`);
            console.log(`Dept ID: ${user.departmentId}`);
            console.log(`Branch ID: ${user.branchId}`);
            console.log(`Department: ${user.department}`);
        }

        // Asset to check
        console.log('\n--- Inspecting Asset: Projector Panasonic ---');
        // Asset ID from previous step: 6982f6e34ceab1e2f6e067fa
        const asset = await Asset.findById('6982f6e34ceab1e2f6e067fa');
        if (asset) {
            console.log(`ID: ${asset._id}`);
            console.log(`Name: ${asset.name}`);
            console.log(`Dept ID: ${asset.departmentId}`);
            console.log(`Branch ID: ${asset.branchId}`);
            console.log(`Location ID: ${asset.locationId}`);
        } else {
            console.log('Asset 6982f6e34ceab1e2f6e067fa not found');
            // Try to find ANY asset for Audio Visual
            const avAssets = await Asset.find({ departmentId: '697a11c82c41e792c8a7d81a' }).limit(3);
            console.log(`\nFound ${avAssets.length} other AV assets:`);
            avAssets.forEach(a => console.log(`- ${a.name} (Branch: ${a.branchId})`));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

inspectAccess();
