import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: false,
        unique: true,
        uppercase: true,
        trim: true,
        sparse: true // Allows multiple null/undefined if we want, but usually codes should be unique if present
    },
    authorizedDepartments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    }],
    description: {
        type: String,
        required: false
    },
    icon: {
        type: String, // Store icon name (e.g., Material Symbol name)
        default: 'category'
    },
    technicalSpecsTemplate: {
        type: Map,
        of: String,
        default: {}
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: false
    },
    isInfrastructure: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Category = mongoose.model('Category', categorySchema);
