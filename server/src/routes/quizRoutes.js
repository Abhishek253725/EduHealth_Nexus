import express from 'express';
import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ===============================
// ✅ SCORE FUNCTION
// ===============================
function scoreQuiz(questions, answers) {
  let correct = 0;

  questions.forEach((q, i) => {
    if (Number(answers[i]) === Number(q.correctIndex)) {
      correct += 1;
    }
  });

  return questions.length
    ? Math.round((correct / questions.length) * 100)
    : 0;
}

// ===============================
// ✅ GET ALL QUIZZES
// ===============================
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

    const list = await Quiz.find(filter)
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===============================
// ✅ GET SINGLE QUIZ
// ===============================
router.get('/:id', protect, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course', 'title');

    if (!quiz) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(quiz);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===============================
// ✅ CREATE QUIZ (FIXED)
// ===============================
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { course, title, dueDate, questions } = req.body;

    const c = await Course.findById(course);
    if (!c) return res.status(400).json({ message: 'Invalid course' });

    // ✅ FIX: ensure correctIndex is number
    const safeQuestions = (questions || []).map((q) => ({
      text: q.text,
      options: q.options,
      correctIndex: Number(q.correctIndex),
    }));

    const quiz = await Quiz.create({
      course,
      teacher: c.teacher,
      title,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      questions: safeQuestions,
    });

    // 🔔 Notify students (optional but good)
    for (const e of c.enrollments) {
      await Notification.create({
        user: e.student,
        type: 'exam',
        title: 'New Quiz',
        body: quiz.title,
      });
    }

    res.status(201).json(quiz);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===============================
// ✅ ATTEMPT QUIZ (FINAL FIX)
// ===============================
router.post('/:id/attempt', protect, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('course');

    if (!quiz) {
      return res.status(404).json({ message: 'Not found' });
    }

    // ✅ check enrollment
    const enrolled = quiz.course.enrollments.some(
      (e) => e.student.toString() === req.userId
    );

    if (!enrolled) {
      return res.status(403).json({ message: 'Not enrolled' });
    }

    // ✅ prevent duplicate attempt
    const already = quiz.attempts.find(
      (a) => a.student.toString() === req.userId
    );

    if (already) {
      return res.json({
        message: 'Already attempted',
        score: already.score,
      });
    }

    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be array' });
    }

    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid answers length' });
    }

    // ✅ CALCULATE SCORE
    const score = scoreQuiz(quiz.questions, answers);

    // ✅ SAVE ATTEMPT
    quiz.attempts.push({
      student: req.userId,
      answers,
      score,
    });

    await quiz.save();

    res.json({ score });

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===============================
// ✅ RESULT HISTORY
// ===============================
router.get('/history', protect, async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      'attempts.student': req.userId,
    });

    const history = quizzes.map((q) => {
      const attempt = q.attempts.find(
        (a) => a.student.toString() === req.userId
      );

      return {
        title: q.title,
        score: attempt.score,
        date: attempt.createdAt,
      };
    });

    res.json(history);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ===============================
// ✅ LEADERBOARD
// ===============================
router.get('/leaderboard/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId)
      .populate('attempts.student', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const leaderboard = quiz.attempts
      .sort((a, b) => b.score - a.score)
      .map((a) => ({
        name: a.student?.name || 'Unknown',
        score: a.score,
      }));

    res.json(leaderboard);

  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;