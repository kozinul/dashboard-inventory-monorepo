
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Asset } from '../models/asset.model.js';
import { Assignment } from '../models/assignment.model.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory');
        
        console.log('--- Finding Mismatched Assignments (User Dept != Asset Dept) ---');
        
        // Find all active assignments
        const activeAssignments = await Assignment.find({
            status: 'assigned',
            isDeleted: { $ne: true },
            userId: { $exists: true, $ne: null }
        });

        const mismatches = [];

        for (const asgn of activeAssignments) {
            const user = await User.findById(asgn.userId);
            const asset = await Asset.findById(asgn.assetId);

            if (user && asset) {
                const userDept = user.departmentId?.toString();
                const assetDept = asset.departmentId?.toString();

                if (userDept && assetDept && userDept !== assetDept) {
                    mismatches.push({
                        userName: user.name,
                        userDeptId: userDept,
                        assetName: asset.name,
                        assetDeptId: assetDept,
                        assignmentId: asgn._id
                    });
                }
            }
        }

        if (mismatches.length === 0) {
            console.log('No other mismatched assignments found.');
        } else {
            console.log(`Found ${mismatches.length} mismatched assignments:`);
            console.log(JSON.stringify(mismatches, null, 2));
        }

    } catch (err) {
        console.error('Scan failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check().catch(console.error);
