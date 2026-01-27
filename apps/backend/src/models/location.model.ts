import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        default: null
    },
    capacity: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Maintenance'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Index for efficient parent lookups
locationSchema.index({ parentId: 1 });

export const Location = mongoose.model('Location', locationSchema);
