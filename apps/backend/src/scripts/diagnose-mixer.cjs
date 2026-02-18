const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

// Define schemas directly to avoid import issues
const AssetSchema = new mongoose.Schema({
    name: String,
    model: String,
    status: String,
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department: String
});

const TransferSchema = new mongoose.Schema({
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    status: String,
    fromBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    toBranchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    createdAt: Date
});

const BranchSchema = new mongoose.Schema({ name: String });
const DepartmentSchema = new mongoose.Schema({ name: String });

const Asset = mongoose.model('Asset', AssetSchema);
const Transfer = mongoose.model('Transfer', TransferSchema);
const Branch = mongoose.model('Branch', BranchSchema);
const Department = mongoose.model('Department', DepartmentSchema);

async function diagnose() {
    try {
        console.log('Connecting to:', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const projectorAssets = await Asset.find({ name: /projector/i }).populate('branchId').populate('departmentId');
        console.log(`\nFound ${projectorAssets.length} projector assets:`);
        projectorAssets.forEach(a => {
            console.log(`- [${a._id}] "${a.name}" | Status: ${a.status} | Branch: ${a.branchId?.name} | Dept: ${a.departmentId?.name}`);
        });

        const agung = await mongoose.connection.db.collection('users').findOne({ $or: [{ name: /agung/i }, { username: /agung/i }] });
        if (agung) {
            console.log(`\nUser Agung (Raw Data):`);
            console.log(JSON.stringify(agung, null, 2));

            if (agung.departmentId) {
                const dept = await mongoose.connection.db.collection('departments').findOne({ _id: agung.departmentId });
                console.log(`Depertment: ${dept ? dept.name : 'Not Found'}`);
            }
        } else {
            console.log(`\nUser Agung not found.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Diagnosis failed:', error);
        process.exit(1);
    }
}

diagnose();
