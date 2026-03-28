import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import dbConnect from '../lib/mongodb.js';
import Attendance from '../models/Attendance.js';
import Session from '../models/Session.js';
import Teacher from '../models/Teacher.js';

async function migrate() {
  await dbConnect();
  console.log('Connected to MongoDB');

  try {
    // Attempt to drop old index
    try {
      await Attendance.collection.dropIndex('studentId_1_date_1');
      console.log('Old index studentId_1_date_1 dropped successfully.');
    } catch (e) {
      console.log('Old index might not exist or already dropped:', e.message);
    }

    // Find all distinct (teacherId, date) combinations
    const records = await Attendance.aggregate([
      {
        $group: {
          _id: { teacherId: '$teacherId', date: '$date' },
        }
      }
    ]);

    console.log(`Found ${records.length} distinct sessions to migrate.`);

    for (let r of records) {
      const { teacherId, date } = r._id;
      
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        console.warn(`Teacher ${teacherId} not found, skipping records for date ${date}`);
        continue;
      }

      // Check if session already exists
      let session = await Session.findOne({ teacherId, date });
      if (!session) {
        session = new Session({
          teacherId,
          subject: teacher.subject,
          date,
          startTime: '00:00', // Default dummy time for migrated data
          endTime: '23:59',
        });
        await session.save();
        console.log(`Created session ${session._id} for teacher ${teacher.name} on ${date}`);
      }

      // Update attendance records to link to this session
      const res = await Attendance.updateMany(
        { teacherId, date, sessionId: { $exists: false } },
        { $set: { sessionId: session._id } }
      );
      console.log(`Updated ${res.modifiedCount} records for session ${session._id}`);
    }

    // Try to drop the new index, and recreate it (in case it wasn't built correctly or there are dupes in old data)
    try {
       await Attendance.collection.createIndex({ studentId: 1, sessionId: 1 }, { unique: true });
       console.log('New index studentId_1_sessionId_1 created successfully.');
    } catch (e) {
       console.log('Error creating new index, you might have duplicate studentId+sessionId:', e.message);
    }

    console.log('Migration completed completely!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
