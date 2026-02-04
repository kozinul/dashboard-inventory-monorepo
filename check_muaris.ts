
import mongoose from 'mongoose';
import { User } from './apps/backend/src/models/user.model';
import { Department } from './apps/backend/src/models/department.model';
import { MaintenanceRecord } from './apps/backend/src/models/maintenance.model';
import { Asset } from './apps/backend/src/models/asset.model';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory_db';

const checkUser = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // flexible search for 'muaris'
        const users = await User.find({
            $or: [
                { username: { $regex: 'muaris', $options: 'i' } },
                { name: { $regex: 'muaris', $options: 'i' } },
                { email: { $regex: 'muaris', $options: 'i' } }
            ]
        });

        console.log(`Found ${users.length} users matching 'muaris':`);

        for (const user of users) {
            console.log('------------------------------------------------');
            console.log('User:', user.name);
            console.log('Role:', user.role);
            console.log('Department String:', user.department);
            console.log('Department ID:', user.departmentId);

            if (user.departmentId) {
                const dept = await Department.findById(user.departmentId);
                console.log('Department Name (from ID):', dept ? dept.name : 'NOT FOUND');

                // Check for assets in this department
                const assetCount = await Asset.countDocuments({ departmentId: user.departmentId });
                console.log('Assets in Dept:', assetCount);

                // Check for tickets in this department
                // 1. Requested by users in dept
                const deptUsers = await User.find({ departmentId: user.departmentId }).select('_id');
                const userIds = deptUsers.map(u => u._id);
                const ticketsRequested = await MaintenanceRecord.countDocuments({ requestedBy: { $in: userIds } });
                console.log('Tickets Requested by Dept Users:', ticketsRequested);

                // 2. Assigned to dept
                const ticketsAssigned = await MaintenanceRecord.countDocuments({ assignedDepartment: user.departmentId });
                console.log('Tickets Assigned to Dept:', ticketsAssigned);

                // 3. For assets in dept
                const deptAssets = await Asset.find({ departmentId: user.departmentId }).select('_id');
                const assetIds = deptAssets.map(a => a._id);
                const ticketsAssets = await MaintenanceRecord.countDocuments({ asset: { $in: assetIds } });
                console.log('Tickets For Assets in Dept:', ticketsAssets);

            } else {
                console.log('WARNING: No Department ID assigned!');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
