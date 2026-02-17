import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset } from '../models/asset.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

const listAssets = async () => {
    try {
        await connectDB();
        const assets = await Asset.find({}).limit(5);
        console.log('Assets found:');
        console.table(assets.map(a => ({
            id: a._id.toString(),
            name: a.name,
            serial: a.serial
        })));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listAssets();
