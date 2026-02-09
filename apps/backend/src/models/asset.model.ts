import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    serial: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false // Make required when data migrated?
    },
    department: {
        type: String,
        required: false,
        trim: true
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false
    },
    location: {
        type: String,
        required: false,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'storage', 'retired', 'assigned', 'request maintenance'],
        default: 'active'
    },
    requiresExternalService: {
        type: Boolean,
        default: false
    },
    images: [{
        url: String,
        caption: String,
        filename: String
    }],
    purchaseDate: Date,
    value: {
        type: Number,
        required: true
    },
    technicalSpecifications: {
        type: Map,
        of: String,
        default: {}
    },
    rentalRates: [{
        name: { type: String, required: true },
        rate: { type: Number, required: true },
        unit: { type: String, required: true },
        notes: String
    }],
    vendor: {
        name: { type: String, trim: true },
        contact: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true },
        address: { type: String, trim: true },
        website: { type: String, trim: true }
    },
    invoice: {
        number: { type: String, trim: true },
        url: String,
        filename: String,
        uploadDate: Date
    },
    warranty: {
        expirationDate: Date,
        details: String
    },
    maintenanceHistory: [{
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceRecord' },
        ticketNumber: String,
        description: String,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cost: Number,
        completedAt: Date
    }]
}, {
    timestamps: true
});

export const Asset = mongoose.model('Asset', assetSchema);
