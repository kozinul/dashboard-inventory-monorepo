import mongoose from 'mongoose';

const stockOpnameItemSchema = new mongoose.Schema({
    stockOpnameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StockOpname',
        required: true
    },
    // For Supply (Consumables)
    supplyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supply',
        required: false
    },
    systemQuantity: {
        type: Number,
        default: 0
    },
    physicalQuantity: {
        type: Number,
        default: 0
    },
    
    // For Asset (Serial Tracked)
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: false
    },
    isAssetFound: {
        type: Boolean,
        default: false
    },

    difference: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'MATCH', 'DISCREPANCY', 'MISSING', 'FOUND'],
        default: 'PENDING'
    },
    notes: {
        type: String,
        trim: true
    },
    checkedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, {
    timestamps: true
});

export const StockOpnameItem = mongoose.model('StockOpnameItem', stockOpnameItemSchema);
