const mongoose = require('mongoose');
const dotenv = require('dotenv');
// We need to point to the BUILT files or just use Mongoose directly without models if we want to be safe from TS issues
// But let's try to verify via direct DB queries using schemas defined in code? No, we can't import TS files in CJS easily.
// Best approach: Define simple schemas in this script or just use mongoose.connection.db

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory_app';
const API_URL = 'http://localhost:3000/api/v1';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
}

async function verifyDataIntegrity() {
    console.log('\n--- Verifying Data Integrity ---');

    // Check Branches
    const branches = await mongoose.connection.db.collection('branches').find({}).toArray();
    console.log(`Total Branches: ${branches.length}`);
    branches.forEach(b => console.log(` - ${b.name} (${b._id})`));

    // Check Categories
    const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
    const categoriesWithoutBranch = categories.filter(c => !c.branchId);
    console.log(`Total Categories: ${categories.length}`);
    console.log(`Categories without BranchId: ${categoriesWithoutBranch.length}`);

    // Check Maintenance Records
    const records = await mongoose.connection.db.collection('maintenancerecords').find({}).toArray();
    const recordsWithoutBranch = records.filter(r => !r.branchId);
    console.log(`Total Maintenance Records: ${records.length}`);
    console.log(`Records without BranchId: ${recordsWithoutBranch.length}`);

    // Check Users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Total Users: ${users.length}`);

    return { branches, users, categories };
}

async function run() {
    await connectDB();
    await verifyDataIntegrity();
    process.exit(0);
}

run();
