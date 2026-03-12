
import mongoose from 'mongoose';
import { Asset } from '../src/models/asset.model.js';
import { MaintenanceRecord } from '../src/models/maintenance.model.js';

async function inspectAssetStatuses() {
    console.log('Starting inspection script...');
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        console.log(`Connecting to: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const assets = await Asset.find({});
        console.log(`Found ${assets.length} assets`);

        const tickets = await MaintenanceRecord.find({ 
            status: { $in: ['In Progress', 'External Service', 'Sent', 'Pending'] } 
        });
        console.log(`Found ${tickets.length} active maintenance/service tickets`);

        console.log('\n--- Asset Status Inspection ---');
        let issuesFound = 0;
        for (const asset of assets) {
            const activeTicket = tickets.find(t => t.asset && t.asset.toString() === asset._id.toString());
            
            let expectedStatus = 'active'; 
            if (activeTicket) {
                expectedStatus = 'maintenance';
            }

            const currentStatus = asset.status;
            
            if (currentStatus !== expectedStatus && (currentStatus === 'maintenance' || expectedStatus === 'maintenance')) {
                issuesFound++;
                console.log(`[ISSUE] Asset: ${asset.name} (${asset._id})`);
                console.log(`  Current Status: ${currentStatus}`);
                if (activeTicket) {
                    console.log(`  Active Ticket ID: ${activeTicket._id}`);
                    console.log(`  Active Ticket Status: ${activeTicket.status}`);
                    console.log(`  Ticket Type: ${activeTicket.serviceProviderType}`);
                } else {
                    console.log(`  No active maintenance ticket found.`);
                }
                console.log(`  Expected Status: ${expectedStatus}`);
            }
        }

        if (issuesFound === 0) {
            console.log('No status mismatch issues found.');
        } else {
            console.log(`\nTotal issues found: ${issuesFound}`);
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectAssetStatuses();
