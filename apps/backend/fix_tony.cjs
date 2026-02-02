
const mongoose = require('mongoose');

// Simple env parser (copy-paste because I can't rely on paths)
const MONGO_URI = 'mongodb://mongo:27017/inventory'; // From previous output

const userSchema = new mongoose.Schema({
    username: String,
    departmentId: mongoose.Schema.Types.ObjectId,
    department: String
});
const User = mongoose.model('User', userSchema);
const departmentSchema = new mongoose.Schema({
    name: String
});
const Department = mongoose.model('Department', departmentSchema);

async function fixUser() {
    try {
        await mongoose.connect(MONGO_URI);

        let dept = await Department.findOne({ name: 'Information Technology' });
        if (!dept) {
            console.log('Creating IT department...');
            dept = await Department.create({ name: 'Information Technology', code: 'IT' });
        }

        const user = await User.findOne({ username: 'tony' });
        if (user) {
            user.departmentId = dept._id;
            user.department = dept.name;
            await user.save();
            console.log('Updated Tony with departmentId:', dept._id);
        } else {
            console.log('Tony not found');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

fixUser();
