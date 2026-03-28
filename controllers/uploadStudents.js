import dbConnect from '../lib/mongodb.js';
import Student from '../models/Student.js';
import { withAuth } from '../lib/authMiddleware.js';
import multer from 'multer';
import * as xlsx from 'xlsx';

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}


async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Run the multer middleware
    await runMiddleware(req, res, upload.single('file'));

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    await dbConnect();
    const teacherId = req.user.id; // From withAuth

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'File is empty or invalid format' });
    }

    const { classYear, batch, specialRemark } = req.body;

    if (!classYear || !batch) {
      return res.status(400).json({ error: 'Class/Year and Batch are required' });
    }

    // Map the excel data to student objects
    const studentsToInsert = data.map((row) => ({
      name: row.Name || row.name,
      rollNo: String(row.RollNo || row.rollNo || row.roll || row.Roll_No),
      classYear,
      batch,
      specialRemark: specialRemark || '',
      teacherId,
    })).filter(student => student.name && student.rollNo);

    if (studentsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid student records found. Expected columns: Name, RollNo' });
    }

    // Upsert or insert students
    let addedCount = 0;
    for (const student of studentsToInsert) {
      const existing = await Student.findOne({ rollNo: student.rollNo, teacherId });
      if (!existing) {
        await Student.create(student);
        addedCount++;
      } else {
        // Option to update name and categories if they changed
        existing.name = student.name;
        existing.classYear = student.classYear;
        existing.batch = student.batch;
        existing.specialRemark = student.specialRemark;
        await existing.save();
      }
    }

    return res.status(200).json({ 
      message: `Successfully processed ${studentsToInsert.length} records. Added ${addedCount} new students.`,
      addedCount 
    });
  } catch (error) {
    console.error('Upload students error:', error);
    return res.status(500).json({ error: 'Internal server error while processing file' });
  }
}

export default withAuth(handler, ['teacher']);
