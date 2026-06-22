import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('Connecting to: ', process.env.MONGODB_URI);
import { User } from '../src/models/user.model.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-app');
        const users = await User.find({});
        users.forEach(u => console.log(u.username, u.role));
        console.log('Users fetched successfully.');
    } catch(err) {
        console.error('Error:', err);
    }
    process.exit(0);
}
run();
