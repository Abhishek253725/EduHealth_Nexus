import express from 'express';
import Assignment from '../models/Assignment.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// =======================================
// GET ALL ASSIGNMENTS
// =======================================
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};

    if (req.userRole === 'teacher') {
      filter.teacher = req.userId;
    }

    if (req.userRole === 'student') {
      const courses = await Course.find({
        'enrollments.student': req.userId,
      }).select('_id');

      filter.course = { $in: courses.map((c) => c._id) };
    }

    const assignments = await Assignment.find(filter)
      .populate('course', 'title')
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// =======================================
// CREATE ASSIGNMENT (teacher/admin)
// =======================================
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const {
      course,
      title,
      description,
      dueDate,
      fileUrl,
    } = req.body;

    const selectedCourse = await Course.findById(course);

    if (!selectedCourse) {
      return res.status(400).json({ message: 'Invalid course' });
    }

    if (
      req.userRole === 'teacher' &&
      selectedCourse.teacher.toString() !== req.userId
    ) {
      return res.status(403).json({ message: 'Not your course' });
    }

    const assignment = await Assignment.create({
      course,
      teacher: selectedCourse.teacher,
      title,
      description: description || '',
      fileUrl: fileUrl || '',
      dueDate: new Date(dueDate),
    });

    // notify students
    for (const enroll of selectedCourse.enrollments) {
      await Notification.create({
        user: enroll.student,
        type: 'assignment',
        title: 'New Assignment',
        body: `${title} uploaded`,
        meta: {
          assignmentId: assignment._id,
          courseId: selectedCourse._id,
        },
      });
    }

    res.status(201).json(assignment);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// =======================================
// SUBMIT ASSIGNMENT (student)
// =======================================
router.post('/:id/submit', protect, authorize('student'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate(
      'course'
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const enrolled = assignment.course.enrollments.some(
      (e) => e.student.toString() === req.userId
    );

    if (!enrolled) {
      return res.status(403).json({ message: 'Not enrolled' });
    }

    const alreadySubmitted = assignment.submissions.find(
      (s) => s.student.toString() === req.userId
    );

    if (alreadySubmitted) {
      return res.status(400).json({ message: 'Already submitted' });
    }

    const { text, fileUrl } = req.body;

    assignment.submissions.push({
      student: req.userId,
      text: text || '',
      fileUrl: fileUrl || '',
    });

    await assignment.save();

    await Notification.create({
      user: assignment.teacher,
      type: 'assignment',
      title: 'Assignment Submitted',
      body: `${assignment.title} has a new submission`,
      meta: {
        assignmentId: assignment._id,
      },
    });

    res.json({
      message: 'Assignment submitted successfully',
      assignment,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// =======================================
// GRADE ASSIGNMENT (teacher/admin)
// =======================================
router.patch(
  '/:id/grade',
  protect,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { studentId, score } = req.body;

      const assignment = await Assignment.findById(req.params.id);

      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }

      if (
        req.userRole === 'teacher' &&
        assignment.teacher.toString() !== req.userId
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const submission = assignment.submissions.find(
        (s) => s.student.toString() === studentId
      );

      if (!submission) {
        return res.status(404).json({ message: 'Submission not found' });
      }

      submission.score = Number(score);

      await assignment.save();

      await Notification.create({
        user: studentId,
        type: 'performance',
        title: 'Assignment Graded',
        body: `${assignment.title}: ${score}%`,
        meta: {
          assignmentId: assignment._id,
        },
      });

      res.json({
        message: 'Score updated',
        assignment,
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

export default router;