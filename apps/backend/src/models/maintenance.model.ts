import mongoose from 'mongoose';

// Helper to generate ticket number
const generateTicketNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('MaintenanceRecord').countDocuments({
        createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
        }
    });
    return `MT-${dateStr}-${String(count + 1).padStart(3, '0')}`;
};

const maintenanceRecordSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        unique: true
    },
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    // Who requested the maintenance (user who owns the asset)
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    // Who processed the ticket (department manager)
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
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
        required: function () { return (this as any).serviceProviderType === 'Vendor'; }
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
    assignedDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'In Progress', 'Done', 'Rejected', 'Cancelled', 'On Hold', 'External Service', 'Pending', 'Escalated'],
        default: 'Draft'
    },
    beforePhotos: [String],
    afterPhotos: [String],
    suppliesUsed: [{
        supply: { type: mongoose.Schema.Types.ObjectId, ref: 'Supply' },
        quantity: Number,
        name: String,
        cost: Number
    }],
    pendingNote: String,
    visualProof: [String],
    notes: [{
        content: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date }
    }],
    history: [{
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        notes: String
    }]
}, {
    timestamps: true
});

// Pre-save hook to generate ticket number
maintenanceRecordSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        this.ticketNumber = await generateTicketNumber();
    }
    next();
});

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
