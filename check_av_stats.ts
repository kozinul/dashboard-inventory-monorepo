
import mongoose from 'mongoose';
import { Department } from './apps/backend/src/models/department.model';
import { MaintenanceRecord } from './apps/backend/src/models/maintenance.model';
import { Asset } from './apps/backend/src/models/asset.model';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory_db';

const checkStats = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const dept = await Department.findOne({ name: 'Audio Visual' });
        if (!dept) return;

        console.log(`Stats for ${dept.name} (${dept._id})`);

        const assetCount = await Asset.countDocuments({ departmentId: dept._id });
        console.log(`Assets: ${assetCount}`);

        const exactDeptTickets = await MaintenanceRecord.countDocuments({ assignedDepartment: dept._id });
        console.log(`Tickets Assigned to Dept: ${exactDeptTickets}`);

        // Also check if any assets in this dept have tickets
        const deptAssets = await Asset.find({ departmentId: dept._id }).select('_id');
        const assetIds = deptAssets.map(a => a._id);
        const relatedTickets = await MaintenanceRecord.countDocuments({ asset: { $in: assetIds } });
        console.log(`Tickets linked to Dept Assets: ${relatedTickets}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkStats();
