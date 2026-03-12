
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Asset } from '../models/asset.model.js';
import { Assignment } from '../models/assignment.model.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory', {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('--- Users with "Officer" ---');
        const itOfficers = await User.find({ 
            $or: [
                { designation: /it officer/i },
                { name: /it officer/i },
                { role: /it officer/i }
            ]
        });
        console.log(JSON.stringify(itOfficers.map(u => ({ id: u._id, name: u.name, designation: u.designation, role: u.role })), null, 2));

        console.log('\n--- MIC Assets ---');
        const micAssets = await Asset.find({ name: /mic/i });
        console.log(JSON.stringify(micAssets.map(a => ({ id: a._id, name: a.name, serial: a.serial, status: a.status })), null, 2));

        console.log('\n--- Assignments for MIC Assets ---');
        const assignments = await Assignment.find({ 
            assetId: { $in: micAssets.map(a => a._id) },
            status: 'assigned'
        }).populate('userId', 'name designation');
        console.log(JSON.stringify(assignments.map(asgn => ({ 
            asset: asgn.assetId, 
            user: (asgn.userId as any)?.name || 'Unknown', 
            designation: (asgn.userId as any)?.designation || 'Unknown'
        })), null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

check().catch(console.error);
