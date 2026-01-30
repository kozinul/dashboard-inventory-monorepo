import mongoose from 'mongoose';

const supplyHistorySchema = new mongoose.Schema({
    supplyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supply',
        required: true
    },
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'RESTOCK', 'USE', 'DELETE'],
        required: true
    },
    quantityChange: {
        type: Number,
        default: 0
    },
    previousStock: {
        type: Number,
        default: 0
    },
    newStock: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const SupplyHistory = mongoose.model('SupplyHistory', supplyHistorySchema);
