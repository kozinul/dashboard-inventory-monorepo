import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset } from './models/asset.model.js';
import { User } from './models/user.model.js';
import { Branch } from './models/branch.model.js';
import { Transfer } from './models/transfer.model.js';
import { Supply } from './models/supply.model.js';

dotenv.config();

const migrateBranches = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected');

        // 1. Find or Create Head Office
        let headOffice = await Branch.findOne({
            $or: [{ isHeadOffice: true }, { code: 'HO' }]
        });

        if (!headOffice) {
            console.log('Head Office not found. Creating one...');
            headOffice = await Branch.create({
                name: 'Head Office',
                code: 'HO',
                type: 'Head Office',
                isHeadOffice: true,
                status: 'Active',
                address: 'Main Headquarters'
            });
        }
        console.log(`Using Branch: ${headOffice.name} (${headOffice._id})`);

        // 2. Update Assets (ALL)
        const assetResult = await Asset.updateMany(
            {},
            { $set: { branchId: headOffice._id } }
        );
        console.log(`Updated ${assetResult.modifiedCount} Assets (All).`);

        // 3. Update Users (ALL)
        const userResult = await User.updateMany(
            {},
            { $set: { branchId: headOffice._id } }
        );
        console.log(`Updated ${userResult.modifiedCount} Users (All).`);

        // 4. Update Transfers (ALL to Head Office)
        const transferResultFrom = await Transfer.updateMany(
            {},
            { $set: { fromBranchId: headOffice._id } }
        );
        const transferResultTo = await Transfer.updateMany(
            {},
            { $set: { toBranchId: headOffice._id } }
        );
        console.log(`Updated Transfers: ${transferResultFrom.modifiedCount} From, ${transferResultTo.modifiedCount} To (All).`);

        // 5. Update Supplies (ALL)
        const supplyResult = await Supply.updateMany(
            {},
            { $set: { branchId: headOffice._id } }
        );
        console.log(`Updated ${supplyResult.modifiedCount} Supplies (All).`);

        console.log('Migration Completed Successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrateBranches();
