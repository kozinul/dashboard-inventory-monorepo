
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Minimal schemas
const userSchema = new mongoose.Schema({
    username: String,
    role: String
}, { strict: false });
const User = mongoose.model('User', userSchema);

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });

        const user = await User.findOne({ role: 'technician' });
        if (!user) {
            console.error('Technician user not found!');
            process.exit(1);
        }

        console.log(`Found user: ${user.username} (${user._id})`);

        // Generate Token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
        console.log('Generated Token');

        // Make Request
        console.log('Making request to inventory API...');
        const url = 'http://localhost:3000/api/v1/inventory/items';

        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response Status:', res.status);

        if (res.ok) {
            const data: any = await res.json();
            console.log('Total Assets Returned:', data.data.length);
            console.log('Pagination:', data.pagination);
            console.log('Asset Names:', data.data.map((a: any) => `${a.name} (Dept: ${a.department})`));
        } else {
            console.error('Request failed:', await res.text());
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
