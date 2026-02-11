import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    fromDepartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    toDepartmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'],
        default: 'Pending'
    },
    notes: {
        type: String,
        trim: true
    },
    transferDate: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, {
    timestamps: true
});

export const Transfer = mongoose.model('Transfer', transferSchema);
