
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also try backend .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-app';

console.log('Using MONGO_URI:', MONGO_URI);

const COLLECTIONS_TO_MIGRATE = [
    'units',
    'categories',
    'vendors',
    'locations',
    'assets',
    'supplies',
    'maintenancerecords',
    'rentals',
    'disposalrecords',
    'events'
    // 'users' // Skipping users as per earlier thought, or include? User said "Migrate all existing data". 
    // User model has branchId. If user is tied to a specific branch, they should be migrated.
];

async function migrate() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Find the target branch
        const targetBranchName = 'Bali Nusa Dua Convention Center';
        // We need to access the "branches" collection directly or via model
        const Branch = mongoose.connection.collection('branches');
        let targetBranch = await Branch.findOne({ name: targetBranchName });

        let branchId;

        if (!targetBranch) {
            console.log(`Branch '${targetBranchName}' not found. Creating it...`);
            const result = await Branch.insertOne({
                name: targetBranchName,
                location: 'Bali',
                code: 'BNDCC',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            branchId = result.insertedId;
            console.log(`Created branch: ${branchId}`);
        } else {
            branchId = targetBranch._id;
            console.log(`Found target branch: ${branchId}`);
        }

        // 2. Update collections
        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            console.log(`Migrating collection: ${collectionName}...`);

            try {
                const collection = mongoose.connection.collection(collectionName);
                // Update all documents that don't have a branchId or where we want to force it?
                // User said "Migrate existing data to the Bali... branch".
                // Implies ALL existing data should move there.
                // So updateMany({})

                const result = await collection.updateMany(
                    {}, // Match all
                    { $set: { branchId: branchId } }
                );
                console.log(`  Updated ${result.modifiedCount} documents in ${collectionName}`);
            } catch (err) {
                console.error(`  Error migrating ${collectionName}:`, err.message);
            }
        }

        // Users?
        // If we migrate users, we might lock out admins if they are tied to a branch?
        // Superusers usually have access to all.
        // Regular users: if moved to Bali, they only see Bali.
        // This seems to be the intent: "Migrate master data".
        // I'll skip users to be safe, or ask?
        // "Migrate all relevant data ... existing data to be migrated".
        // I will migrate users too, assuming they are staff of that branch.
        // Except 'superuser' role?
        // Let's migrate users but maybe filter?
        // The prompt says "Migrate all existing data in the system (Assets, Users, Supplies...)".
        // So YES, migrate Users.

        console.log('Migrating collection: users...');
        const usersCollection = mongoose.connection.collection('users');
        // Only update if not superuser? Or all?
        // "Migrate all existing data".
        const userResult = await usersCollection.updateMany(
            {},
            { $set: { branchId: branchId } }
        );
        console.log(`  Updated ${userResult.modifiedCount} documents in users`);

        console.log('Migration completed.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

migrate();
