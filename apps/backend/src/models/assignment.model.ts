
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
        required: false
    },
    assignedTo: {
        type: String,
        required: function (this: any) { return !this.userId; }, // Required if userId is not present
        trim: true
    },
    assignedToTitle: {
        type: String,
        trim: true
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
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
        enum: ['assigned', 'returned', 'maintenance'],
        default: 'assigned',
        required: true
    },
    notes: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Assignment = mongoose.model('Assignment', assignmentSchema);
