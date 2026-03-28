import dbConnect from '../lib/mongodb.js';
import Session from '../models/Session.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { withAuth } from '../lib/authMiddleware.js';
import mongoose from 'mongoose';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await dbConnect();
    const { subjectId, type } = req.query; // subjectId is teacherId for now since 1 teacher = 1 subject in DB
    
    // Overall Defaulters logic
    if (type === 'overall') {
      const defaulters = await Student.aggregate([
        {
          $lookup: {
            from: 'sessions',
            localField: 'teacherId',
            foreignField: 'teacherId',
            as: 'sessions',
          }
        },
        { $addFields: { totalLectures: { $size: '$sessions' } } },
        {
          $lookup: {
            from: 'attendances',
            let: { sid: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [ { $eq: ['$studentId', '$$sid'] }, { $eq: ['$status', 'Present'] } ] } } },
              { $group: { _id: '$studentId', attended: { $sum: 1 } } }
            ],
            as: 'attendedAgg'
          }
        },
        { $addFields: { lecturesAttended: { $ifNull: [ { $arrayElemAt: ['$attendedAgg.attended', 0] }, 0 ] } } },
        {
          $addFields: {
            percentage: {
              $cond: [
                { $gt: ['$totalLectures', 0] },
                { $multiply: [ { $divide: ['$lecturesAttended', '$totalLectures'] }, 100 ] },
                0
              ]
            }
          }
        },
        { $match: { totalLectures: { $gt: 0 }, percentage: { $lt: 75 } } },
        {
          $project: {
            studentId: '$_id',
            name: 1,
            rollNo: 1,
            classYear: 1,
            batch: 1,
            lecturesAttended: 1,
            totalLectures: 1,
            percentage: '$percentage',
          }
        },
        { $sort: { percentage: 1, rollNo: 1 } }
      ]);

      return res.status(200).json({ type: 'overall', defaulters });
    } else {
       // Subject-wise defaulters (for a specific teacher)
       let teacherId = subjectId;
       if (req.user.role === 'teacher') {
         teacherId = req.user.id;
       }

       if (!teacherId) {
          return res.status(400).json({ error: 'teacherId (as subjectId) is required for subject-wise defaulters' });
       }

      const teacherObjectId = new mongoose.Types.ObjectId(teacherId);
      const totalLectures = await Session.countDocuments({ teacherId: teacherObjectId });
      const sessionIds = await Session.find({ teacherId: teacherObjectId }).distinct('_id');

      const defaulters = await Student.aggregate([
        { $match: { teacherId: teacherObjectId } },
        {
          $lookup: {
            from: 'attendances',
            let: { sid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$studentId', '$$sid'] },
                      { $eq: ['$status', 'Present'] },
                      { $in: ['$sessionId', sessionIds] },
                    ]
                  }
                }
              },
              { $group: { _id: '$studentId', attended: { $sum: 1 } } }
            ],
            as: 'attendedAgg'
          }
        },
        { $addFields: { lecturesAttended: { $ifNull: [ { $arrayElemAt: ['$attendedAgg.attended', 0] }, 0 ] } } },
        {
          $addFields: {
            totalLectures: totalLectures,
            percentage: {
              $cond: [
                { $gt: [totalLectures, 0] },
                { $multiply: [ { $divide: ['$lecturesAttended', totalLectures] }, 100 ] },
                0
              ]
            }
          }
        },
        { $match: { totalLectures: { $gt: 0 }, percentage: { $lt: 75 } } },
        {
          $project: {
            studentId: '$_id',
            name: 1,
            rollNo: 1,
            classYear: 1,
            batch: 1,
            lecturesAttended: 1,
            totalLectures: 1,
            percentage: '$percentage',
          }
        },
        { $sort: { percentage: 1, rollNo: 1 } }
      ]);

      return res.status(200).json({ type: 'subject', teacherId, totalLectures, defaulters });
    }
  } catch (error) {
    console.error('Get defaulters error:', error);
    return res.status(500).json({ error: 'Internal server error while getting defaulters' });
  }
}

export default withAuth(handler, ['teacher', 'admin']);
