import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import Teacher from '../models/Teacher.js';
import { withAuth } from '../lib/authMiddleware.js';
import mongoose from 'mongoose';

/**
 * Requirement compatibility:
 * - GET /sessions/:subject_id
 * In this app there is no subject table; each Teacher has a single subject.
 * So ":subject_id" is treated as either a TeacherId (ObjectId) or a subject string.
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const raw = req.params.subjectId;
    let query = {};

    if (raw === 'me') {
      query.teacherId = req.user.id;
    } else if (mongoose.Types.ObjectId.isValid(raw)) {
      query.teacherId = new mongoose.Types.ObjectId(raw);
    } else {
      // subject name string
      const teachers = await Teacher.find({ subject: raw }).select('_id').lean();
      const teacherIds = teachers.map(t => t._id);
      query.teacherId = { $in: teacherIds };
    }

    // Teachers can only view their own sessions
    if (req.user.role === 'teacher') {
      query.teacherId = new mongoose.Types.ObjectId(req.user.id);
    }

    const sessions = await Session.find(query).sort({ date: -1, startTime: -1, createdAt: -1 });
    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions by subject error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);

