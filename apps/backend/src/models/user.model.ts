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
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    password: {
        type: String,
        required: true
    },
    designation: String,
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Offline', 'Away'],
        default: 'Active'
    },
    role: {
        type: String,
        enum: ['superuser', 'admin', 'manager', 'user', 'auditor'],
        default: 'user'
    }
}, {
    timestamps: true
});

import bcrypt from 'bcryptjs';

// ... schema definition ...

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model('User', userSchema);
