import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import Teacher from '../models/Teacher.js';
import { withAuth } from '../lib/authMiddleware.js';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    // Admin can request any faculty; teacher can only see themselves
    let facultyId = req.params.facultyId;
    if (req.user.role === 'teacher') {
      facultyId = req.user.id;
    }

    if (!facultyId || facultyId === 'me') {
      facultyId = req.user.id;
    }

    if (!mongoose.Types.ObjectId.isValid(facultyId)) {
      return res.status(400).json({ error: 'Invalid faculty_id' });
    }

    const teacherObjectId = new mongoose.Types.ObjectId(facultyId);
    const teacher = await Teacher.findById(teacherObjectId).select('name subject email').lean();
    if (!teacher) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    const sessionsTaken = await Session.countDocuments({ teacherId: teacherObjectId });

    // Per-session attendance counts (present/absent)
    const perSession = await Session.aggregate([
      { $match: { teacherId: teacherObjectId } },
      { $sort: { date: -1, startTime: -1, createdAt: -1 } },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'records'
        }
      },
      {
        $addFields: {
          presentCount: {
            $size: {
              $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'Present'] } }
            }
          },
          absentCount: {
            $size: {
              $filter: { input: '$records', as: 'r', cond: { $eq: ['$$r.status', 'Absent'] } }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          subject: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          presentCount: 1,
          absentCount: 1,
        }
      }
    ]);

    // Flat attendance records (optionally filtered by sessionId)
    const { sessionId } = req.query;
    const attendanceQuery = { teacherId: teacherObjectId };
    if (sessionId) attendanceQuery.sessionId = sessionId;
    const attendance = await Attendance.find(attendanceQuery)
      .select('studentId sessionId date status createdAt')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      facultyId: teacherObjectId,
      faculty: teacher,
      sessionsTaken,
      sessions: perSession,
      attendance,
    });
  } catch (error) {
    console.error('Get attendance by faculty error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);

