import mongoose from 'mongoose';

const assetHistorySchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'RETURN', 'TRANSFER', 'EVENT_BOOK', 'EVENT_RELEASE', 'ADJUST', 'MOVE', 'STATUS_CHANGE', 'INSTALL', 'DISMANTLE'],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false
    },
    fromDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    toDepartment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    fromStatus: {
        type: String,
        required: false
    },
    toStatus: {
        type: String,
        required: false
    },
    notes: {
        type: String,
        trim: true
    },
    referenceType: {
        type: String,
        enum: ['Event', 'Assignment', 'Transfer', 'Manual', 'StockOpname', 'Import', 'Maintenance', 'Rental', 'Disposal', null],
        required: false
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    }
}, {
    timestamps: true
});

export const AssetHistory = mongoose.model('AssetHistory', assetHistorySchema);
