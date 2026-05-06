import express from 'express';
import TeacherFeedback from '../models/TeacherFeedback.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) return res.status(400).json({ message: 'studentId required' });
    if (req.userRole === 'parent') {
      const parent = await User.findById(req.userId);
      if (!parent.linkedStudents.map((id) => id.toString()).includes(studentId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (req.userRole === 'student' && studentId !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const list = await TeacherFeedback.find({ student: studentId })
      .populate('teacher', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { student, course, message } = req.body;
    const s = await User.findById(student);
    if (!s || s.role !== 'student') return res.status(400).json({ message: 'Invalid student' });
    if (course) {
      const c = await Course.findById(course);
      if (!c || c.teacher.toString() !== req.userId) {
        if (req.userRole !== 'admin') return res.status(403).json({ message: 'Not your course' });
      }
    }
    const fb = await TeacherFeedback.create({ student, teacher: req.userId, course, message });
    for (const pid of s.parentIds || []) {
      await Notification.create({
        user: pid,
        type: 'performance',
        title: 'Teacher feedback',
        body: message.slice(0, 120),
        meta: { studentId: student, feedbackId: fb._id },
      });
    }
    res.status(201).json(fb);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
