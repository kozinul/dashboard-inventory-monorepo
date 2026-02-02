
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Define schema inline to avoid import issues
const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    role: String,
    departmentId: mongoose.Schema.Types.ObjectId,
    department: String
});
const User = mongoose.model('User', userSchema);

dotenv.config({ path: './apps/backend/.env' });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_app';

async function checkUser() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await User.find({
            $or: [{ username: /tony/i }, { name: /tony/i }]
        });

        console.log('Users found:', users.map(u => ({
            username: u.username,
            name: u.name,
            role: u.role,
            dept: u.department,
            deptId: u.departmentId
        })));

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUser();
