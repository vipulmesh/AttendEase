import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    // Admin can pass any facultyId; teacher views their own
    let facultyId = req.query.facultyId;
    if (req.user.role === 'teacher') {
      facultyId = req.user.id;
    }

    if (!facultyId) {
      return res.status(400).json({ error: 'facultyId is required' });
    }

    // Optional: detailed analytics for one student (session-by-session)
    const { studentId } = req.query;

    const sessions = await Session.find({ teacherId: facultyId })
      .select('_id date startTime endTime')
      .sort({ date: -1, startTime: -1, createdAt: -1 });
    const totalLectures = sessions.length;
    const sessionIds = sessions.map(s => s._id);

    if (studentId) {
      // For a single student: return per-session status (default Absent when no record exists)
      const records = await Attendance.find({ sessionId: { $in: sessionIds }, studentId })
        .select('sessionId status')
        .lean();
      const statusBySession = new Map(records.map(r => [r.sessionId.toString(), r.status]));

      const attended = records.filter(r => r.status === 'Present').length;
      const percentage = totalLectures > 0 ? Number(((attended / totalLectures) * 100).toFixed(2)) : 0;

      const sessionBreakdown = sessions.map(s => ({
        sessionId: s._id,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: statusBySession.get(s._id.toString()) || 'Absent',
      }));

      return res.status(200).json({
        totalLectures,
        studentId,
        lecturesAttended: attended,
        percentage,
        sessions: sessionBreakdown,
      });
    }

    const students = await Student.find({ teacherId: facultyId }).lean();

    // Aggregated present counts per student (fast, computed in DB)
    const presentCounts = sessionIds.length === 0
      ? []
      : await Attendance.aggregate([
          { $match: { sessionId: { $in: sessionIds }, status: 'Present' } },
          { $group: { _id: '$studentId', attended: { $sum: 1 } } },
        ]);
    const attendedByStudent = new Map(presentCounts.map(r => [r._id.toString(), r.attended]));

    const studentAnalytics = students.map((student) => {
      const attended = attendedByStudent.get(student._id.toString()) || 0;
      const percentage = totalLectures > 0 ? Number(((attended / totalLectures) * 100).toFixed(2)) : 0;
      return {
        studentId: student._id,
        name: student.name,
        rollNo: student.rollNo,
        classYear: student.classYear,
        batch: student.batch,
        specialRemark: student.specialRemark,
        createdAt: student.createdAt,
        lecturesAttended: attended,
        totalLectures,
        percentage,
      };
    });

    return res.status(200).json({
      totalLectures,
      studentAnalytics
    });
  } catch (error) {
    console.error('Get faculty analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);
