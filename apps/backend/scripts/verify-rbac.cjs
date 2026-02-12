
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory_app';
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const API_URL = 'http://localhost:3000/api/v1';

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        // Find users
        const users = await db.collection('users').find({}).toArray();
        const superuser = users.find(u => u.role === 'superuser');
        const manager = users.find(u => u.role === 'manager');
        const baliBranch = await db.collection('branches').findOne({ name: 'Bali Nusa Dua Convention Center' });

        if (!superuser) {
            console.log('Skipping Superuser test (no superuser found)');
        }
        if (!manager) {
            console.log('Skipping Manager test (no manager found)');
        }

        // Test 1: Manager
        if (manager && baliBranch) {
            console.log(`\nTesting Manager: ${manager.name} (${manager.role})`);
            const token = jwt.sign({ id: manager._id }, JWT_SECRET, { expiresIn: '1h' });
            try {
                const response = await fetch(`${API_URL}/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status !== 200) throw new Error(`Status ${response.status}`);
                const data = await response.json();

                console.log(`[Success] Got ${data.length} categories`);

                // Validate filtering
                const invalid = data.filter(c => c.branchId && c.branchId !== baliBranch._id.toString());
                if (invalid.length > 0) {
                    console.error('[FAIL] Manager saw categories from other branches:', invalid.map(i => i.name));
                } else {
                    console.log('[PASS] All visible categories belong to user branch (or global)');
                }
            } catch (e) {
                console.error('[FAIL] Manager request failed:', e.message);
            }
        }

        // Test 2: Superuser
        if (superuser) {
            console.log(`\nTesting Superuser: ${superuser.name} (${superuser.role})`);
            const token = jwt.sign({ id: superuser._id }, JWT_SECRET, { expiresIn: '1h' });
            try {
                const response = await fetch(`${API_URL}/categories`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status !== 200) throw new Error(`Status ${response.status}`);
                const data = await response.json();

                console.log(`[Success] Got ${data.length} categories`);
                // Superuser should see ALL (assuming there are 4 total as per DB check)
                if (data.length === 4) {
                    console.log('[PASS] Superuser sees all categories');
                } else {
                    console.log(`[WARN] Superuser saw ${data.length}/4 categories (maybe filtering is active?)`);
                }
            } catch (e) {
                console.error('[FAIL] Superuser request failed:', e.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
