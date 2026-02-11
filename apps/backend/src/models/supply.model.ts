import mongoose from 'mongoose';

const supplySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    partNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    unit: {
        type: String,
        default: 'Pcs'
    },
    unitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Unit'
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
    },
    description: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    minimumStock: {
        type: Number,
        required: true,
        default: 1
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
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: false
    },
    compatibleModels: [{
        type: String,
        trim: true
    }],
    cost: {
        type: Number,
        default: 0
    },
    images: [{
        url: String,
        caption: String,
        filename: String
    }]
}, {
    timestamps: true
});



export const Supply = mongoose.model('Supply', supplySchema);
