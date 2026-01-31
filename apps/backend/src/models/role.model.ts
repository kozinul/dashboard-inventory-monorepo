import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: String,
    permissions: [{
        resource: {
            type: String,
            required: true
        },
        actions: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false }
        }
    }],
    isSystem: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Role = mongoose.model('Role', roleSchema);
