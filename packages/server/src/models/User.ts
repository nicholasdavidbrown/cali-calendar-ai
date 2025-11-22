import mongoose, { Schema, Document } from 'mongoose';

export type MessageStyle = 'professional' | 'witty' | 'sarcastic' | 'mission';

export interface IUser extends Document {
  email: string;
  microsoftId: string;
  phone?: string; // Optional - users can add later in settings
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  timezone: string;
  smsTime: string;
  isActive: boolean;
  messageStyle: MessageStyle;
  lastSmsSentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    microsoftId: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: false, // Optional - users add their phone number later
      trim: true,
      default: '',
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Australia/Brisbane',
    },
    smsTime: {
      type: String,
      default: '07:00',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    messageStyle: {
      type: String,
      enum: ['professional', 'witty', 'sarcastic', 'mission'],
      default: 'professional',
    },
    lastSmsSentDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IUser>('User', UserSchema);
