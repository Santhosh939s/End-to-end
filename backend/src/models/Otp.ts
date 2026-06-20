import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const OtpSchema: Schema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 600 seconds (10 minutes)
});

// Create an index to quickly find OTPs by email
OtpSchema.index({ email: 1 });

export default mongoose.model<IOtp>('Otp', OtpSchema);
