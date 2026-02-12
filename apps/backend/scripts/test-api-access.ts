import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:3000/api/v1';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'default_secret', {
        expiresIn: '30d',
    });
};

const testWithToken = async () => {
    const userId = '6982e8aeca416ffe4236ae42'; // muaris
    const token = generateToken(userId);
    console.log('Generated token for muaris');

    try {
        console.log(`Fetching assets from ${API_URL}/inventory/items...`);
        const response = await fetch(`${API_URL}/inventory/items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            const data = await response.json();
            console.log(`Data count: ${data.data.length}`);
            if (data.data.length > 0) {
                console.log('Sample Asset:', JSON.stringify(data.data[0], null, 2));
            } else {
                console.log('No assets returned.');
            }
        } else {
            const err = await response.text();
            console.log('Error response:', err);
        }

    } catch (error) {
        console.error('Error fetching assets:', error);
    }
};

testWithToken();
