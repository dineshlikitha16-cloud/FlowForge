import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  userId?: mongoose.Types.ObjectId;
  email?: string;
  phone?: string;
  otp: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    phone: { type: String },
    otp: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index to automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for fast lookups
otpSchema.index({ email: 1 });
otpSchema.index({ phone: 1 });
otpSchema.index({ userId: 1 });

export default mongoose.model<IOTP>('OTP', otpSchema);
