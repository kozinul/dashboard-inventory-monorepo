
import mongoose from 'mongoose';
import { User } from '../src/models/user.model';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const username = process.argv[2];

const inspectUser = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User ${username} not found`);
        } else {
            console.log('User found:');
            console.log(JSON.stringify(user.toJSON(), null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

inspectUser();
