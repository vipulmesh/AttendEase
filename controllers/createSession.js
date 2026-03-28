import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import Teacher from '../models/Teacher.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const teacherId = req.user.id;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Date, start time, and end time are required' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
       return res.status(404).json({ error: 'Teacher not found' });
    }

    const session = new Session({
      teacherId,
      subject: teacher.subject,
      date,
      startTime,
      endTime
    });

    await session.save();

    return res.status(201).json({ message: 'Session created successfully', session });
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({ error: 'Internal server error while creating session' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);
