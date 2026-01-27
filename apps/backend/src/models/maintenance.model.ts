import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Repair', 'Routine', 'Emergency', 'Firmware', 'Installation', 'Inspection', 'Maintenance'],
        required: true
    },
    status: {
        type: String,
        enum: ['In Progress', 'Done', 'Pending'],
        default: 'Pending'
    },
    visualProof: [String]
}, {
    timestamps: true
});

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
