import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  isAllDay: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Add indexes for efficient querying
CalendarEventSchema.index({ userId: 1 });
CalendarEventSchema.index({ start: 1 });
CalendarEventSchema.index({ userId: 1, start: 1 });

export default mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
