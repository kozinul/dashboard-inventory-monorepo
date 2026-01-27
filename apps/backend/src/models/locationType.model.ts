import mongoose from 'mongoose';

const locationTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    level: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

export const LocationType = mongoose.model('LocationType', locationTypeSchema);
