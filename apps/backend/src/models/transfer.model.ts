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
    fromBranchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    toBranchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
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
    managerApprovedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    managerApprovedAt: Date,
    status: {
        type: String,
        enum: ['Pending', 'WaitingApproval', 'InTransit', 'Completed', 'Rejected', 'Cancelled'],
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
