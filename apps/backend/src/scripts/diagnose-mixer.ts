import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models using relative paths or from the compiled dist if needed
// Since we are running with ts-node, we can try importing source
import { Asset } from '../models/asset.model.js';
import { Transfer } from '../models/transfer.model.js';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-dashboard';

async function diagnose() {
    try {
        console.log('Connecting to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const mixerAssets = await Asset.find({
            $or: [
                { name: { $regex: /mix/i } },
                { name: { $regex: /mick/i } },
                { model: { $regex: /mix/i } }
            ]
        }).populate('departmentId').populate('branchId');

        console.log(`Found ${mixerAssets.length} potential assets:`);
        mixerAssets.forEach(a => {
            console.log(`- ID: ${a._id}, Name: ${a.name}, Status: ${a.status}, Branch: ${a.branchId?.name || (a.branchId as any)}, Dept: ${a.departmentId?.name || a.department}`);
        });

        if (mixerAssets.length > 0) {
            const assetIds = mixerAssets.map(a => a._id);
            const transfers = await Transfer.find({ assetId: { $in: assetIds } })
                .populate('fromBranchId')
                .populate('toBranchId')
                .populate('fromDepartmentId')
                .populate('toDepartmentId');

            console.log(`\nFound ${transfers.length} transfers related to these assets:`);
            transfers.forEach(t => {
                console.log(`- ID: ${t._id}, Asset: ${t.assetId}, Status: ${t.status}, From: ${t.fromBranchId?.name}, To: ${t.toBranchId?.name}, Created: ${t.createdAt}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
