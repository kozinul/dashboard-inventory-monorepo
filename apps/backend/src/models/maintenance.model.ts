import mongoose from 'mongoose';
import { MaintenanceStatusSchema, MaintenanceTypeSchema, ServiceProviderTypeSchema } from '@dashboard/schemas';

// Helper to generate ticket number (with retry for race condition safety)
const generateTicketNumber = async (retryCount = 0): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const count = await mongoose.model('MaintenanceRecord').countDocuments({
        createdAt: {
            $gte: startOfDay,
            $lt: endOfDay
        }
    });
    return `MT-${dateStr}-${String(count + 1 + retryCount).padStart(3, '0')}`;
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
        enum: ServiceProviderTypeSchema.options,
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
        enum: MaintenanceTypeSchema.options,
        required: true
    },
    assignedDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    status: {
        type: String,
        enum: MaintenanceStatusSchema.options,
        default: 'Draft'
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
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

// Pre-save hook to generate ticket number with retry logic
maintenanceRecordSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        let retries = 0;
        const maxRetries = 5;
        while (retries < maxRetries) {
            try {
                this.ticketNumber = await generateTicketNumber(retries);
                break;
            } catch (err: any) {
                if (err.code === 11000 && retries < maxRetries - 1) {
                    retries++;
                    continue;
                }
                throw err;
            }
        }
    }
    next();
});

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
