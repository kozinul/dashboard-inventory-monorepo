import mongoose from 'mongoose';

const disposalRecordSchema = new mongoose.Schema({
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true,
        unique: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['End of Life', 'Damaged', 'Upgrade', 'Lost/Stolen'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending Approval', 'Scheduled', 'Disposed', 'Compliance Check'],
        default: 'Pending Approval'
    },
    location: String,
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

export const DisposalRecord = mongoose.model('DisposalRecord', disposalRecordSchema);
