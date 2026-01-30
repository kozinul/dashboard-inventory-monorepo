import mongoose, { Schema, Document } from 'mongoose';

export interface IRental extends Document {
    assetId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
    rentalDate: Date;
    expectedReturnDate: Date;
    returnedDate?: Date;
    status: 'active' | 'returned' | 'overdue';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RentalSchema: Schema = new Schema({
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Assuming 'User' model exists
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
    rentalDate: { type: Date, default: Date.now },
    expectedReturnDate: { type: Date, required: true },
    returnedDate: { type: Date },
    status: {
        type: String,
        enum: ['active', 'returned', 'overdue'],
        default: 'active'
    },
    notes: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IRental>('Rental', RentalSchema);
