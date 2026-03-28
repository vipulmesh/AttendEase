import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rollNo: {
    type: String,
    required: true,
  },
  classYear: {
    type: String,
    required: true,
  },
  batch: {
    type: String,
    required: true,
  },
  specialRemark: {
    type: String,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
}, { timestamps: true });

// Prevent duplicate roll numbers for the same teacher
StudentSchema.index({ rollNo: 1, teacherId: 1 }, { unique: true });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
