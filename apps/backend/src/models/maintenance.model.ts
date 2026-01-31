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
        required: function () { return this.serviceProviderType === 'Internal'; }
    },
    serviceProviderType: {
        type: String,
        enum: ['Internal', 'Vendor'],
        default: 'Internal',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: function () { return this.serviceProviderType === 'Vendor'; }
    },
    cost: {
        type: Number,
        min: 0
    },
    expectedCompletionDate: {
        type: Date
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
