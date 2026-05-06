import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import Attendance from '../models/Attendance.js';
import TeacherFeedback from '../models/TeacherFeedback.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('parent', 'admin'));

router.get('/children', async (req, res) => {
  try {
    const parent = await User.findById(req.userId).populate('linkedStudents', '-password');
    res.json(parent.linkedStudents || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/link-child', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    const student = await User.findOne({ email: email.toLowerCase().trim() });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    const parent = await User.findById(req.userId);
    const sid = student._id.toString();
    if (!parent.linkedStudents.map((id) => id.toString()).includes(sid)) {
      parent.linkedStudents.push(student._id);
      await parent.save();
    }
    if (!student.parentIds.map((id) => id.toString()).includes(req.userId)) {
      student.parentIds.push(parent._id);
      await student.save();
    }
    await Notification.create({
      user: student._id,
      type: 'system',
      title: 'Parent linked',
      body: `${parent.name} linked to your account`,
    });
    res.json({ message: 'Linked', student: { _id: student._id, name: student.name, email: student.email } });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/student-progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const parent = await User.findById(req.userId);
    if (
      req.userRole !== 'admin' &&
      !parent.linkedStudents.map((id) => id.toString()).includes(studentId)
    ) {
      return res.status(403).json({ message: 'Not linked to this student' });
    }
    const courses = await Course.find({ 'enrollments.student': studentId }).populate('teacher', 'name');
    const courseIds = courses.map((c) => c._id);

    const assignments = await Assignment.find({ course: { $in: courseIds } });
    let submitted = 0;
    let graded = 0;
    let scoreSum = 0;
    for (const a of assignments) {
      const sub = a.submissions.find((s) => s.student.toString() === studentId);
      if (sub) {
        submitted += 1;
        if (sub.score != null) {
          graded += 1;
          scoreSum += sub.score;
        }
      }
    }

    const quizzes = await Quiz.find({ course: { $in: courseIds } });
    let quizScores = [];
    for (const q of quizzes) {
      const att = q.attempts.find((x) => x.student.toString() === studentId);
      if (att) quizScores.push(att.score);
    }

    const attendanceRows = await Attendance.find({ course: { $in: courseIds } });
    let present = 0;
    let total = 0;
    for (const row of attendanceRows) {
      const rec = row.records.find((r) => r.student.toString() === studentId);
      if (rec) {
        total += 1;
        if (rec.present) present += 1;
      }
    }
    const attendancePct = total ? Math.round((present / total) * 100) : null;

    const subjectScores = {};
    for (const c of courses) {
      const subs = await Assignment.find({ course: c._id });
      let sum = 0;
      let n = 0;
      for (const a of subs) {
        const sub = a.submissions.find((s) => s.student.toString() === studentId);
        if (sub && sub.score != null) {
          sum += sub.score;
          n += 1;
        }
      }
      const qlist = await Quiz.find({ course: c._id });
      for (const q of qlist) {
        const att = q.attempts.find((x) => x.student.toString() === studentId);
        if (att) {
          sum += att.score;
          n += 1;
        }
      }
      const key = c.subject || c.title;
      subjectScores[key] = n ? Math.round(sum / n) : 0;
    }

    const assignmentCompletion =
      assignments.length > 0 ? Math.round((submitted / assignments.length) * 100) : 0;
    const avgFromAssignments = graded > 0 ? Math.round(scoreSum / graded) : null;
    const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : null;
    const parts = [avgFromAssignments, avgQuiz].filter((x) => x != null);
    const averageScore = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;

    const feedback = await TeacherFeedback.find({ student: studentId })
      .populate('teacher', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      courses,
      stats: {
        assignmentCompletion,
        averageScore,
        attendancePct,
        subjectScores,
      },
      recentFeedback: feedback,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/notifications/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const parent = await User.findById(req.userId);
    if (
      req.userRole !== 'admin' &&
      !parent.linkedStudents.map((id) => id.toString()).includes(studentId)
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const notes = await Notification.find({ user: studentId }).sort({ createdAt: -1 }).limit(50);
    res.json(notes);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
