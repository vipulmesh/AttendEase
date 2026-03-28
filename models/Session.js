import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
}, { timestamps: true });

// Prevent accidental duplicate session creation for the same lecture window.
// (Keeps existing schema; "subject_id" in requirements maps to teacherId in this app.)
SessionSchema.index(
  { teacherId: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
