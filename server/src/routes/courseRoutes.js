import express from 'express';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

/** Browse published courses (students enroll from here) */
router.get('/discover', protect, async (req, res) => {
  try {
    if (req.userRole !== 'student' && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Students only' });
    }
    const courses = await Course.find({ isPublished: true })
      .populate('teacher', 'name email avatar')
      .sort({ updatedAt: -1 });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    if (req.userRole === 'parent' || req.userRole === 'doctor') {
      return res.json([]);
    }
    let q = {};
    if (req.userRole === 'teacher') q.teacher = req.userId;
    else if (req.userRole === 'student') q['enrollments.student'] = req.userId;
    const courses = await Course.find(q).populate('teacher', 'name email avatar').sort({ updatedAt: -1 });
    res.json(courses);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher', 'name email avatar');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.userRole === 'teacher' && course.teacher._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.userRole === 'student') {
      const enrolled = course.enrollments.some((e) => e.student.toString() === req.userId);
      if (!enrolled) return res.status(403).json({ message: 'Not enrolled' });
    }
    if (req.userRole === 'parent' || req.userRole === 'doctor') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description, subject } = req.body;
    const teacher = req.userRole === 'admin' && req.body.teacherId ? req.body.teacherId : req.userId;
    const course = await Course.create({
      title,
      description: description || '',
      subject: subject || '',
      teacher,
    });
    res.status(201).json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (req.userRole === 'teacher' && course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { title, description, subject, isPublished } = req.body;
    if (title) course.title = title;
    if (description !== undefined) course.description = description;
    if (subject !== undefined) course.subject = subject;
    if (isPublished !== undefined) course.isPublished = isPublished;
    await course.save();
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    const already = course.enrollments.some((e) => e.student.toString() === req.userId);
    if (already) return res.status(400).json({ message: 'Already enrolled' });
    course.enrollments.push({ student: req.userId });
    await course.save();
    const teacher = await User.findById(course.teacher);
    if (teacher) {
      await Notification.create({
        user: teacher._id,
        type: 'system',
        title: 'New enrollment',
        body: `A student enrolled in ${course.title}`,
        meta: { courseId: course._id },
      });
    }
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/:id/materials', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (req.userRole === 'teacher' && course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { type, title, url, publicId } = req.body;
    course.materials.push({ type, title, url: url || '', publicId: publicId || '' });
    await course.save();
    const students = course.enrollments.map((e) => e.student);
    for (const sid of students) {
      await Notification.create({
        user: sid,
        type: 'announcement',
        title: 'New course material',
        body: `${title} added to ${course.title}`,
        meta: { courseId: course._id },
      });
    }
    res.json(course);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Not found' });
    if (req.userRole === 'teacher' && course.teacher.toString() !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await course.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
