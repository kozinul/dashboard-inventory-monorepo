
import mongoose from 'mongoose';
import { User } from './apps/backend/src/models/user.model';
import { Department } from './apps/backend/src/models/department.model';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory_db';

const fixUser = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'muaris' });
        if (!user) {
            console.log('User muaris not found');
            return;
        }

        console.log(`Found user: ${user.name}, Department: ${user.department}, DeptID: ${user.departmentId}`);

        if (!user.department) {
            console.log('User has no department string');
            return;
        }

        // Find department by name (case insensitive)
        const dept = await Department.findOne({ name: { $regex: new RegExp(`^${user.department}$`, 'i') } });

        if (!dept) {
            console.log(`Region/Department '${user.department}' not found in Department collection!`);
            // Create it if it doesn't exist? Or list available ones?
            const allDepts = await Department.find({});
            console.log('Available Departments:', allDepts.map(d => d.name));
            return;
        }

        console.log(`Found matching Department: ${dept.name} (${dept._id})`);

        user.departmentId = dept._id;
        await user.save();

        console.log('Successfully updated user departmentId!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixUser();
