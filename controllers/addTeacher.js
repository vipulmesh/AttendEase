import dbConnect from '../lib/mongodb.js';
import Teacher from '../models/Teacher.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const { name, subject, email, password } = req.body;

    if (!name || !subject || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher with this email already exists' });
    }

    const newTeacher = await Teacher.create({
      name,
      subject,
      email,
      password,
    });

    return res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: newTeacher._id,
        name: newTeacher.name,
        subject: newTeacher.subject,
        email: newTeacher.email,
      },
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['admin']);
