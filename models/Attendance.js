import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  date: {
    type: String, // Store as YYYY-MM-DD for easier querying
    required: true,
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
  }
}, { timestamps: true });

// Prevent duplicate attendance for the same student in the same session
// We drop the old { studentId: 1, date: 1 } index in DB manually or via migration.
AttendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
