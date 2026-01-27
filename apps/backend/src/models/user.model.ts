import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: String,
    department: String,
    designation: String,
    status: {
        type: String,
        enum: ['Active', 'Offline', 'Away'],
        default: 'Active'
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user', 'auditor'],
        default: 'user'
    }
}, {
    timestamps: true
});

export const User = mongoose.model('User', userSchema);
