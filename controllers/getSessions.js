import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    let query = {};

    // Support flexible querying
    if (req.query.teacherId) query.teacherId = req.query.teacherId;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.date) query.date = req.query.date;

    // For teacher, default to their own sessions
    if (req.user.role === 'teacher') {
      if (!req.query.teacherId) query.teacherId = req.user.id;
    }

    const sessions = await Session.find(query).sort({ date: -1, startTime: -1, createdAt: -1 });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ error: 'Internal server error while getting sessions' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);
