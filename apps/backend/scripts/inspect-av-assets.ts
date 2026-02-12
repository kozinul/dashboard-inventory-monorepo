import mongoose from 'mongoose';
import { Asset } from '../src/models/asset.model';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import models
import '../src/models/department.model';
import '../src/models/branch.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectAVAssets = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const deptId = '697a11c82c41e792c8a7d81a'; // Audio Visual
        const branchId = '698c821fac43896bb8d635ba'; // Bali Convention Center

        console.log(`\nInspecting Assets for Dept: ${deptId} in Branch: ${branchId}`);
        const assets = await Asset.find({ departmentId: deptId, branchId: branchId });

        console.log(`Found ${assets.length} assets.`);
        assets.forEach(a => {
            console.log(`- ${a.name} [${a.status}] (ID: ${a._id})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

inspectAVAssets();
