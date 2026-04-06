import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongo:27017/inventory');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        if (users.length > 0) {
            console.log("Users:", users.map(u => ({ username: (u as any).username, email: u.email })));
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
check();
