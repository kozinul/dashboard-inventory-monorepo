import mongoose from 'mongoose';
console.log('Connecting to mongodb...');
async function run() {
    try {
        await mongoose.connect('mongodb://mongo:27017/inventory');
        const roleRes = await mongoose.connection.collection('rolepermissions').updateOne(
            { roleSlug: 'technician' },
            { $pull: { permissions: { resource: 'users' } } }
        );
        console.log(`Roles updated: matched ${roleRes.matchedCount}, modified ${roleRes.modifiedCount}`);
        const userRes = await mongoose.connection.collection('users').updateMany(
            { role: 'technician', useCustomPermissions: true },
            { $pull: { customPermissions: { resource: 'users' } } }
        );
        console.log(`Users updated: matched ${userRes.matchedCount}, modified ${userRes.modifiedCount}`);
        console.log('DB cleaning complete!');
    } catch(err) {
        console.error('Error:', err);
    }
    process.exit(0);
}
run();
