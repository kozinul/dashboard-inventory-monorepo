import mongoose from 'mongoose';
import { MaintenanceRecord } from '../src/models/maintenance.model';
import '../src/models/user.model';
import '../src/models/asset.model';
import '../src/models/department.model';
import '../src/models/branch.model';
import '../src/models/supply.model';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const inspectTickets = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const branchId = '698c821fac43896bb8d635ba';

        console.log(`\nInspecting Tickets for Branch: ${branchId}`);
        const branchTickets = await MaintenanceRecord.find({ branchId: branchId })
            .populate('asset', 'name serial department departmentId')
            .populate('requestedBy', 'name email department') // Populating if user ID exists
            .populate('technician', 'name email');

        if (branchTickets.length === 0) {
            console.log('No tickets found in this branch.');
        } else {
            console.log(`Found ${branchTickets.length} tickets.\nDetails:`);
            branchTickets.forEach(t => {
                console.log('---');
                console.log(`Ticket: ${t.ticketNumber} - ${t.title} [${t.status}]`);
                // Check asset department
                const assetDept = (t.asset as any)?.department;
                const assetDeptId = (t.asset as any)?.departmentId;
                console.log(`Asset: ${(t.asset as any)?.name} (Dept: ${assetDept}, ID: ${assetDeptId})`);

                // Check requestedBy
                if (t.requestedBy) {
                    console.log(`Requested By: ${(t.requestedBy as any).name} (Dept: ${(t.requestedBy as any).department})`);
                } else {
                    console.log('Requested By: NULL (User might be deleted)');
                }

                // Check assigned Department
                console.log(`Assigned Dept: ${t.assignedDepartment}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

inspectTickets();
