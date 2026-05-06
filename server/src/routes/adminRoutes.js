import express from 'express';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', async (req, res) => {
  try {
    const byRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const roleMap = Object.fromEntries(byRole.map((r) => [r._id, r.count]));
    const [courses, assignments, quizzes, appointments, notifications] = await Promise.all([
      Course.countDocuments(),
      Assignment.countDocuments(),
      Quiz.countDocuments(),
      Appointment.countDocuments(),
      Notification.countDocuments(),
    ]);
    const recentUsers = await User.find().select('-password').sort({ createdAt: -1 }).limit(8);
    res.json({
      usersTotal: await User.countDocuments(),
      roles: roleMap,
      courses,
      assignments,
      quizzes,
      appointments,
      notifications,
      recentUsers,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: 'Not found' });
    u.isActive = !u.isActive;
    await u.save();
    res.json(u);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
