
import mongoose from 'mongoose';
import { User } from './apps/backend/src/models/user.model';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/backend/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_app';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({
            $or: [{ username: { $regex: 'tony', $options: 'i' } }, { name: { $regex: 'tony', $options: 'i' } }]
        });

        console.log('User found:', user ? {
            username: user.username,
            role: user.role,
            department: user.department,
            departmentId: user.departmentId
        } : 'No user found');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
