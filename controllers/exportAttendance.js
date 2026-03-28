import dbConnect from '../lib/mongodb.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { withAuth } from '../lib/authMiddleware.js';
import * as xlsx from 'xlsx';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const teacherId = req.user.id;
    const { date, sessionId } = req.query; // Optional filters

    let query = { teacherId };
    if (sessionId) {
      query.sessionId = sessionId;
    } else if (date) {
      query.date = date;
    }

    // Fetch attendance records and populate student details
    const attendanceRecords = await Attendance.find(query).populate('studentId', 'name rollNo').sort({ date: -1 });

    if (attendanceRecords.length === 0) {
      return res.status(404).json({ error: 'No attendance records found to export' });
    }

    // Format data for Excel
    const exportData = attendanceRecords.map(record => {
      // Handle cases where student was deleted but attendance remains
      const studentName = record.studentId ? record.studentId.name : 'Unknown Student';
      const studentRollNo = record.studentId ? record.studentId.rollNo : 'N/A';
      
      return {
        RollNo: studentRollNo,
        Name: studentName,
        Date: record.date,
        Status: record.status,
      };
    });

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Generate buffer
    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Send the file
    let filenameDate = date || 'all';
    if (sessionId && exportData.length > 0) {
       filenameDate = exportData[0].Date; // use the date from first record
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${filenameDate}.xlsx"`);
    return res.send(buffer);
  } catch (error) {
    console.error('Export attendance error:', error);
    return res.status(500).json({ error: 'Internal server error while exporting' });
  }
}

export default withAuth(handler, ['teacher']);
