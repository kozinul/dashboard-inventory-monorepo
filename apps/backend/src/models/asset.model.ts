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
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false // Optional for now to not break legacy
    },
    location: { // Legacy string field, keep for now or sync
        type: String,
        required: false,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'storage', 'retired'],
        default: 'active'
    },
    image: String,
    purchaseDate: Date,
    value: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export const Asset = mongoose.model('Asset', assetSchema);
