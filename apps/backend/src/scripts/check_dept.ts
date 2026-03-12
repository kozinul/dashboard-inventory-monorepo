
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Asset } from '../models/asset.model.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory');
        
        const itOfficer = await User.findOne({ designation: /it officer/i });
        const micAsset = await Asset.findOne({ name: /mic/i });

        console.log('--- IT Officer ---');
        console.log(JSON.stringify({
            name: itOfficer?.name,
            departmentId: itOfficer?.departmentId,
            managedDepartments: itOfficer?.managedDepartments
        }, null, 2));

        console.log('\n--- MIC Asset ---');
        console.log(JSON.stringify({
            name: micAsset?.name,
            departmentId: micAsset?.departmentId
        }, null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check().catch(console.error);
