import dbConnect from '../lib/mongodb.js';
import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method === 'POST') {
    return markAttendance(req, res);
  } else if (req.method === 'GET') {
    return getAttendanceForSession(req, res); // Fetch attendance for a specific session to edit
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

async function markAttendance(req, res) {
  try {
    await dbConnect();
    const teacherId = req.user.id;
    const { sessionId, records, date } = req.body; 
    // records format: [{ studentId: '...', status: 'Present' | 'Absent' }, ...]

    // If using the new session-based logic
    if (sessionId) {
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Valid records array is required' });
      }

      // Verify session belongs to teacher
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      if (session.teacherId.toString() !== teacherId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized for this session' });
      }

      // Process all records
      const bulkOps = records.map((record) => ({
        updateOne: {
          filter: { studentId: record.studentId, sessionId: sessionId },
          update: { 
            $set: { 
              teacherId,
              date: session.date, // Store date as well for backward compatibility if needed
              status: record.status 
            } 
          },
          upsert: true, // Create if not exist, update if exists
        }
      }));

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }
    } else if (date) {
      // Fallback for old requests (just in case)
      if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: 'Valid records array is required' });
      }

      // Get or create a default session for the date to map the attendance
      let session = await Session.findOne({ teacherId, date });
      if (!session) {
        session = new Session({
          teacherId,
          subject: req.user.subject || 'Unknown',
          date,
          startTime: '00:00',
          endTime: '23:59',
        });
        await session.save();
      }

      const bulkOps = records.map((record) => ({
        updateOne: {
          filter: { studentId: record.studentId, sessionId: session._id },
          update: { 
            $set: { 
              teacherId, 
              date: date,
              status: record.status 
            } 
          },
          upsert: true, 
        }
      }));

      if (bulkOps.length > 0) {
        await Attendance.bulkWrite(bulkOps);
      }
    } else {
      return res.status(400).json({ error: 'sessionId or date is required' });
    }

    return res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAttendanceForSession(req, res) {
  try {
    await dbConnect();
    const teacherId = req.user.id;
    const { sessionId, date } = req.query;

    if (sessionId) {
       const records = await Attendance.find({ sessionId });
       return res.status(200).json(records);
    } else if (date) {
       // Fallback logic
       const records = await Attendance.find({ teacherId, date });
       return res.status(200).json(records);
    } else {
       return res.status(400).json({ error: 'sessionId or date is required' });
    }
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);
