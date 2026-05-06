import express from 'express';
import Announcement from '../models/Announcement.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { courseId } = req.query;
    const filter = courseId ? { course: courseId } : {};
    if (req.userRole === 'student') {
      const enrolled = await Course.find({ 'enrollments.student': req.userId }).select('_id');
      filter.course = { $in: enrolled.map((c) => c._id) };
    }
    const list = await Announcement.find(filter).populate('author', 'name').sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { course, title, body } = req.body;
    const c = await Course.findById(course);
    if (!c) return res.status(400).json({ message: 'Invalid course' });
    if (req.userRole === 'teacher' && c.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const a = await Announcement.create({ course, author: req.userId, title, body: body || '' });
    for (const e of c.enrollments) {
      await Notification.create({
        user: e.student,
        type: 'announcement',
        title,
        body: body || '',
        meta: { courseId: c._id },
      });
    }
    res.status(201).json(a);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
