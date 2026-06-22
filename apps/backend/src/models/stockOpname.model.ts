import mongoose from 'mongoose';

const stockOpnameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false
    },
    type: {
        type: String,
        enum: ['SUPPLY', 'ASSET', 'BOTH'],
        default: 'SUPPLY'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ONGOING', 'REVIEW', 'COMPLETED', 'CANCELLED'],
        default: 'DRAFT'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

export const StockOpname = mongoose.model('StockOpname', stockOpnameSchema);
