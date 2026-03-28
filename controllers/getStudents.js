import dbConnect from '../lib/mongodb.js';
import Student from '../models/Student.js';
import { withAuth } from '../lib/authMiddleware.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const teacherId = req.user.id;

    // Optional query parameter to filter by name, rollNo, classYear, batch
    const { search, classYear, batch } = req.query;
    let query = { teacherId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
      ];
    }
    if (classYear) query.classYear = classYear;
    if (batch) query.batch = batch;

    const students = await Student.find(query).sort({ rollNo: 1 });

    return res.status(200).json(students);
  } catch (error) {
    console.error('Get students error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler, ['teacher']);
