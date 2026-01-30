import mongoose from 'mongoose';

const assetTemplateSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
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
    defaultValue: {
        type: Number,
        required: true
    },
    technicalSpecifications: {
        type: Map,
        of: String,
        default: {}
    },
    serialPrefix: {
        type: String,
        required: true,
        trim: true
    },
    lastSerialNumber: {
        type: Number,
        default: 0
    },
    images: [{
        url: String,
        caption: String,
        filename: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export const AssetTemplate = mongoose.model('AssetTemplate', assetTemplateSchema);
