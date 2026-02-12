import mongoose from 'mongoose';
import { MaintenanceRecord as MaintenanceTicket } from '../src/models/maintenance.model';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectMaintenance = async (userId, deptId, branchId) => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        console.log(`Inspecting data for User: ${userId}, Dept: ${deptId}, Branch: ${branchId}`);

        // 1. My Tickets (Requested By User)
        const myTickets = await MaintenanceTicket.find({ requestedBy: userId });
        console.log(`\nRequested By User (${myTickets.length}):`);
        myTickets.forEach(t => console.log(`- ${t.ticketNumber}: ${t.title} [${t.status}] (Branch: ${t.branchId})`));

        // 2. Department Tickets (In User's Department)
        // Note: MaintenanceTicket might store department as string or ID. Checking both or model definition.
        // Looking at service, it relates to asset.departmentId usually or user.department
        // Let's check if there's a direct department field on ticket or if it's derived.
        // The model usually has `asset` which has `departmentId`.
        // But let's check what we have.

        // Actually, let's just dump a few tickets to see structure if any exist.
        const allTickets = await MaintenanceTicket.find({}).limit(1);
        if (allTickets.length > 0) {
            console.log('\nSample Ticket Structure:', JSON.stringify(allTickets[0], null, 2));
        }

        const deptTickets = await MaintenanceTicket.find({
            $or: [
                { 'asset.departmentId': deptId },
                { 'requestedBy.department': 'Audio Visual' }, // fallback
            ]
        });
        console.log(`\nDepartment Tickets (${deptTickets.length}):`);
        deptTickets.forEach(t => console.log(`- ${t.ticketNumber}: ${t.title} [${t.status}]`));

        // 3. Branch Tickets (In User's Branch)
        const branchTickets = await MaintenanceTicket.find({ branchId: branchId });
        console.log(`\nBranch Tickets (${branchTickets.length}):`);
        branchTickets.forEach(t => console.log(`- ${t.ticketNumber}: ${t.title} [${t.status}]`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

const userId = '6982e8aeca416ffe4236ae42';
const deptId = '697a11c82c41e792c8a7d81a';
const branchId = '698c821fac43896bb8d635ba';

inspectMaintenance(userId, deptId, branchId);
