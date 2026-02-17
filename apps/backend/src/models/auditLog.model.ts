import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    resourceType: {
        type: String,
        required: true,
        trim: true // e.g., 'Asset', 'Location', 'User', 'Maintenance'
    },
    resourceId: {
        type: String,
        required: false
    },
    resourceName: {
        type: String,
        required: false
    },
    details: {
        type: String,
        required: false
    },
    ipAddress: {
        type: String,
        required: false
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    }
}, {
    timestamps: true
});

// Index for performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
