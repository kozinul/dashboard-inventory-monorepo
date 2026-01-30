
import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    returnedDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['assigned', 'returned'],
        default: 'assigned',
        required: true
    },
    notes: String
}, {
    timestamps: true
});

export const Assignment = mongoose.model('Assignment', assignmentSchema);
