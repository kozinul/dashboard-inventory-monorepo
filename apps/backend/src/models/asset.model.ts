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
        enum: ['active', 'maintenance', 'storage', 'retired'],
        default: 'active'
    },
    images: [String],
    purchaseDate: Date,
    value: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export const Asset = mongoose.model('Asset', assetSchema);
