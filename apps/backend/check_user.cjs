
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Simple env parser
try {
    const envPath = path.resolve(__dirname, 'apps/backend/.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
} catch (e) {
    console.log('Could not read .env file, using default');
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory_app';

const userSchema = new mongoose.Schema({
    username: String,
    name: String,
    role: String,
    departmentId: mongoose.Schema.Types.ObjectId,
    department: String
});
const User = mongoose.model('User', userSchema);

async function checkUser() {
    try {
        console.log('Connecting to:', MONGO_URI);
        await mongoose.connect(MONGO_URI);
        const users = await User.find({
            $or: [{ username: /tony/i }, { name: /tony/i }]
        });

        console.log('Users found:', users.map(u => ({
            id: u._id,
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
