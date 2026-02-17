import mongoose from 'mongoose';
import { AssetStatusSchema } from '@dashboard/schemas';

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
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false // Make required when migrated
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
    parentAssetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: false,
        default: null
    },
    location: {
        type: String,
        required: false,
        trim: true
    },
    status: {
        type: String,
        enum: AssetStatusSchema.options,
        default: 'active'
    },
    // Panel/Container Fields
    isContainer: {
        type: Boolean,
        default: false
    },
    totalSlots: {
        type: Number,
        default: 0
    },
    slotNumber: {
        type: Number,
        default: null
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
    documents: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        filename: { type: String, required: true },
        type: { type: String }, // e.g. 'manual', 'warranty', 'certificate'
        uploadDate: { type: Date, default: Date.now }
    }],
    maintenanceHistory: [{
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaintenanceRecord' },
        ticketNumber: String,
        description: String,
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        cost: Number,
        completedAt: Date
    }],
    activityLog: [{
        action: { type: String, required: true }, // 'installed', 'dismantled', 'status_change', 'updated'
        details: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

export const Asset = mongoose.model('Asset', assetSchema);
