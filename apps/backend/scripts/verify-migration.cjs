
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-app';

const COLLECTIONS_TO_CHECK = [
    'units',
    'categories',
    'vendors',
    'locations',
    'assets',
    'supplies',
    'maintenancerecords',
    'rentals',
    'disposalrecords',
    'events',
    'users'
];

async function verify() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const Branch = mongoose.connection.collection('branches');
        const targetBranch = await Branch.findOne({ name: 'Bali Nusa Dua Convention Center' });

        if (!targetBranch) {
            console.error('Target branch not found!');
            process.exit(1);
        }

        console.log(`Target Branch ID: ${targetBranch._id}`);

        for (const collectionName of COLLECTIONS_TO_CHECK) {
            const collection = mongoose.connection.collection(collectionName);
            const totalCount = await collection.countDocuments({});
            const migratedCount = await collection.countDocuments({ branchId: targetBranch._id });

            console.log(`Collection: ${collectionName}`);
            console.log(`  Total docs: ${totalCount}`);
            console.log(`  Migrated docs: ${migratedCount}`);

            if (totalCount !== migratedCount) {
                console.warn(`  WARNING: ${totalCount - migratedCount} documents not migrated in ${collectionName}`);
                // Show one that is not migrated
                const unmigrated = await collection.findOne({ branchId: { $ne: targetBranch._id } });
                if (unmigrated) {
                    console.log('  Sample unmigrated:', JSON.stringify(unmigrated, null, 2));
                }
            } else {
                console.log(`  OK.`);
            }
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

verify();
