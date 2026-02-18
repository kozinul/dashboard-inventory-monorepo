const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

const BranchSchema = new mongoose.Schema({ name: String });
mongoose.model('Branch', BranchSchema);

const EventSchema = new mongoose.Schema({
    name: String,
    startTime: Date,
    endTime: Date,
    status: String,
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
});

const Event = mongoose.model('Event', EventSchema);

async function checkEvents() {
    try {
        await mongoose.connect(MONGODB_URI);
        const now = new Date();
        console.log('Current Time:', now.toISOString());

        const allEvents = await Event.find().populate('branchId');
        console.log(`Found ${allEvents.length} total events across all branches.\n`);

        allEvents.forEach(e => {
            console.log(`- [${e._id}] "${e.name}"`);
            console.log(`  Status: ${e.status}`);
            console.log(`  Start:  ${e.startTime?.toISOString()}`);
            console.log(`  End:    ${e.endTime?.toISOString()}`);
            console.log(`  Branch: ${e.branchId?.name} (${e.branchId?._id})`);

            const isUpcoming = e.endTime >= now && e.status !== 'cancelled' && e.status !== 'completed';
            console.log(`  Meet upcoming criteria: ${isUpcoming}`);
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
}

checkEvents();
