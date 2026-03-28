import express from 'express';

// Handlers from controllers
import loginHandler from '../controllers/login.js';
import addTeacherHandler from '../controllers/addTeacher.js';
import removeTeacherHandler from '../controllers/removeTeacher.js';
import getTeachersHandler from '../controllers/getTeachers.js';
import uploadStudentsHandler from '../controllers/uploadStudents.js';
import getStudentsHandler from '../controllers/getStudents.js';
import markAttendanceHandler from '../controllers/markAttendance.js';
import exportAttendanceHandler from '../controllers/exportAttendance.js';
import createSessionHandler from '../controllers/createSession.js';
import getSessionsHandler from '../controllers/getSessions.js';
import getFacultyAnalyticsHandler from '../controllers/getFacultyAnalytics.js';
import getDefaultersHandler from '../controllers/getDefaulters.js';
import sessionsBySubjectHandler from '../controllers/sessionsBySubject.js';
import getAttendanceByFacultyHandler from '../controllers/getAttendanceByFaculty.js';

const router = express.Router();

// Define API Routes
router.post('/login', loginHandler);
router.post('/addTeacher', addTeacherHandler);
router.delete('/removeTeacher', removeTeacherHandler);
router.get('/getTeachers', getTeachersHandler);
router.post('/uploadStudents', uploadStudentsHandler);
router.get('/getStudents', getStudentsHandler);
router.all('/markAttendance', markAttendanceHandler);
router.get('/exportAttendance', exportAttendanceHandler);
router.post('/createSession', createSessionHandler);
router.get('/getSessions', getSessionsHandler);
router.get('/getFacultyAnalytics', getFacultyAnalyticsHandler);
router.get('/getDefaulters', getDefaultersHandler);

// Backward-compatible wrappers for specific UI needs
router.post('/sessions/create', createSessionHandler);
router.get('/sessions/:subjectId', sessionsBySubjectHandler);
router.get('/attendance/faculty/:facultyId', getAttendanceByFacultyHandler);
router.get('/defaulters/subject/:subjectId', (req, res) => {
  req.query = { ...req.query, subjectId: req.params.subjectId, type: 'subject' };
  return getDefaultersHandler(req, res);
});
router.get('/defaulters/overall', (req, res) => {
  req.query = { ...req.query, type: 'overall' };
  return getDefaultersHandler(req, res);
});

export default router;
