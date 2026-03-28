import dbConnect from '../lib/mongodb.js';
import Teacher from '../models/Teacher.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const teachers = await Teacher.find({}).select('-password').sort({ createdAt: -1 });

    return res.status(200).json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['admin']);
