import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Branch } from '../models/branch.model.js';
import { Department } from '../models/department.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const initProduction = async () => {
    try {
        await connectDB();

        console.log('--- Production Initialization Started ---');

        // 1. Create Essential Branches
        let headOffice = await Branch.findOne({ code: 'HO' });
        if (!headOffice) {
            headOffice = await Branch.create({
                name: 'Head Office',
                code: 'HO',
                address: 'Main Headquarters',
                isHeadOffice: true,
                status: 'Active'
            });
            console.log('Created Branch: Head Office');
        } else {
            console.log('Branch HO already exists');
        }

        // 2. Create Essential Departments
        const departments = [
            { name: 'IT Infrastructure', code: 'IT' },
            { name: 'Finance & Accounting', code: 'FIN' },
            { name: 'General Operations', code: 'OPS' },
            { name: 'Procurement', code: 'PROC' }
        ];

        for (const dept of departments) {
            const exists = await Department.findOne({ code: dept.code });
            if (!exists) {
                await Department.create(dept);
                console.log(`Created Department: ${dept.name}`);
            }
        }

        // 3. Create Starter Accounts
        const itDept = await Department.findOne({ code: 'IT' });

        const starterUsers = [
            {
                username: 'superuser',
                email: 'superuser@company.com',
                name: 'System Superuser',
                role: 'superuser',
                password: 'password123', // User must change this on first login
                branchId: headOffice._id,
                departmentId: itDept?._id,
                status: 'Active'
            },
            {
                username: 'administrator',
                email: 'admin@company.com',
                name: 'Master Admin',
                role: 'admin',
                password: 'AdminPassword123!',
                branchId: headOffice._id,
                departmentId: itDept?._id,
                status: 'Active'
            },
            {
                username: 'sysadmin',
                email: 'sysadmin@company.com',
                name: 'System Admin',
                role: 'system_admin',
                password: 'SysAdminPassword123!',
                branchId: headOffice._id,
                departmentId: itDept?._id,
                status: 'Active'
            }
        ];

        for (const userData of starterUsers) {
            const exists = await User.findOne({ username: userData.username });
            if (!exists) {
                // Pre-hash password because insertMany doesn't trigger pre-save hooks reliably for updates (though it does for creates)
                // But for new documents, save() or insertMany() will trigger the pre('save') hook in user.model.ts
                await User.create(userData);
                console.log(`Created Starter User: ${userData.username}`);
            } else {
                console.log(`User ${userData.username} already exists`);
            }
        }

        console.log('--- Production Initialization Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Error during production initialization:', error);
        process.exit(1);
    }
};

initProduction();
