import dbConnect from '../lib/mongodb.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Delete associated data (Students and Attendance)
    await Student.deleteMany({ teacherId: id });
    await Attendance.deleteMany({ teacherId: id });
    
    // Delete the teacher
    await Teacher.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Teacher and associated data removed successfully' });
  } catch (error) {
    console.error('Remove teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['admin']);
