import dbConnect from '../lib/mongodb.js';
import Teacher from '../models/Teacher.js';
import { generateToken } from '../lib/authMiddleware.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check for admin login
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@attendance.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPassword) {
      const token = generateToken({ role: 'admin', email: adminEmail });
      return res.status(200).json({
        token,
        user: { role: 'admin', name: 'Admin', email: adminEmail },
      });
    }

    // Check for teacher login
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: teacher._id,
      role: 'teacher',
      email: teacher.email,
    });

    return res.status(200).json({
      token,
      user: {
        id: teacher._id,
        role: 'teacher',
        name: teacher.name,
        subject: teacher.subject,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
