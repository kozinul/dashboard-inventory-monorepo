import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset } from './models/asset.model.js';
import { User } from './models/user.model.js';
import { Branch } from './models/branch.model.js';
import { Transfer } from './models/transfer.model.js';

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

        // 2. Update Assets
        const assetResult = await Asset.updateMany(
            { branchId: { $exists: false } }, // Or $eq: null
            { $set: { branchId: headOffice._id } }
        );
        console.log(`Updated ${assetResult.modifiedCount} Assets.`);

        // 3. Update Users
        const userResult = await User.updateMany(
            { branchId: { $exists: false } },
            { $set: { branchId: headOffice._id } }
        );
        console.log(`Updated ${userResult.modifiedCount} Users.`);

        // 4. Update Transfers (Optional, but good for consistency)
        // Update 'fromBranchId' if missing, based on 'fromDepartment' or fallback
        // Update 'toBranchId' if missing
        const transferResultFrom = await Transfer.updateMany(
            { fromBranchId: { $exists: false } },
            { $set: { fromBranchId: headOffice._id } }
        );
        const transferResultTo = await Transfer.updateMany(
            { toBranchId: { $exists: false } },
            { $set: { toBranchId: headOffice._id } }
        );
        console.log(`Updated Transfers: ${transferResultFrom.modifiedCount} From, ${transferResultTo.modifiedCount} To.`);

        console.log('Migration Completed Successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migrateBranches();
