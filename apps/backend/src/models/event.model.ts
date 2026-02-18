import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    name: string;
    room: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    status: 'planning' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    rentedAssets: {
        assetId: string; // ObjectId
        rentalRate: number;
        rentalRateUnit: string;
    }[];
    planningSupplies: {
        supplyId: string; // ObjectId
        quantity: number;
        cost: number;
    }[];
    departmentId?: string;
    branchId?: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema: Schema = new Schema({
    name: { type: String, required: true },
    room: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['planning', 'scheduled', 'ongoing', 'completed', 'cancelled'],
        default: 'planning'
    },
    rentedAssets: [{
        assetId: { type: Schema.Types.ObjectId, ref: 'Asset' },
        rentalRate: Number,
        rentalRateUnit: String
    }],
    planningSupplies: [{
        supplyId: { type: Schema.Types.ObjectId, ref: 'Supply' },
        quantity: Number,
        cost: Number
    }],
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: false },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: false }
}, {
    timestamps: true
});

export default mongoose.model<IEvent>('Event', EventSchema);
