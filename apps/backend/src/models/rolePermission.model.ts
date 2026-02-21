import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
    roleSlug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
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
    }]
}, {
    timestamps: true
});

export const RolePermission = mongoose.model('RolePermission', rolePermissionSchema);
