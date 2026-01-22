import mongoose from 'mongoose';
import { UserRoleSchema } from '@dashboard/schemas';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
        type: String,
        enum: UserRoleSchema.options,
        default: 'user'
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, {
    timestamps: true
});

export const User = mongoose.model('User', userSchema);
