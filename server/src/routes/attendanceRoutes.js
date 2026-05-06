import express from 'express';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { courseId, studentId } = req.query;
    let filter = {};
    if (courseId) filter.course = courseId;
    if (req.userRole === 'teacher') {
      const mine = await Course.find({ teacher: req.userId }).select('_id');
      filter.course = courseId || { $in: mine.map((c) => c._id) };
    }
    if (req.userRole === 'student') {
      const enrolled = await Course.find({ 'enrollments.student': req.userId }).select('_id');
      filter.course = { $in: enrolled.map((c) => c._id) };
    }
    if (req.userRole === 'parent' && studentId) {
      const enrolled = await Course.find({ 'enrollments.student': studentId }).select('_id');
      filter.course = { $in: enrolled.map((c) => c._id) };
    }
    const rows = await Attendance.find(filter).populate('course', 'title').sort({ date: -1 });
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { course, date, records } = req.body;
    const c = await Course.findById(course);
    if (!c) return res.status(400).json({ message: 'Invalid course' });
    if (req.userRole === 'teacher' && c.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not your course' });
    }
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    let att = await Attendance.findOne({ course, date: d });
    if (att) {
      att.records = records || att.records;
      await att.save();
    } else {
      att = await Attendance.create({
        course,
        teacher: c.teacher,
        date: d,
        records: records || [],
      });
    }
    res.json(att);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: 'Attendance for this date exists; use PATCH' });
    }
    res.status(500).json({ message: e.message });
  }
});

export default router;
