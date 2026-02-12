import mongoose from 'mongoose';
import { MaintenanceRecord } from '../src/models/maintenance.model';
import { Asset } from '../src/models/asset.model';
import { User } from '../src/models/user.model';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Import all models to ensure registration
import '../src/models/department.model';
import '../src/models/branch.model';
import '../src/models/supply.model';
import '../src/models/assignment.model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const createTestTicket = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Target Context
        const deptId = '697a11c82c41e792c8a7d81a'; // Audio Visual
        const branchId = '698c821fac43896bb8d635ba'; // Bali Convention Center
        const userId = '6982e8aeca416ffe4236ae42'; // muaris

        // Find an asset in AV department to attach ticket to, OR just use first available and force dept
        let asset = await Asset.findOne({ departmentId: deptId });
        if (!asset) {
            console.log('No asset found for AV Dept, creating dummy asset...');
            // Need to create one if none exists, but for now let's try finding ANY asset and overriding dept
            asset = await Asset.findOne({});
            if (!asset) throw new Error('No assets in system');
        }

        console.log(`Using Asset: ${asset.name} (${asset._id})`);

        const ticket = new MaintenanceRecord({
            ticketNumber: `TEST-${Date.now()}`,
            asset: asset._id,
            title: 'TEST TICKET FOR MUARIS (AV)',
            description: 'This is a test ticket to verify AV Manager visibility.',
            requestedBy: userId, // Muaris requested it
            requestedAt: new Date(),
            status: 'Sent', // Sent status ensures it appears in Dept Tickets
            type: 'Repair',
            serviceProviderType: 'Internal',
            branchId: branchId,
            assignedDepartment: deptId, // Explicitly assign to AV
            history: [{
                status: 'Sent',
                changedBy: userId,
                changedAt: new Date(),
                notes: 'Test ticket generated'
            }]
        });

        await ticket.save();
        console.log(`Test Ticket Created: ${ticket.ticketNumber}`);
        console.log('Muaris should now see this ticket in "Department Tickets" and "Maintenance".');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

createTestTicket();
