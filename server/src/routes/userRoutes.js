import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect, authorize, attachUser } from '../middleware/auth.js';

const router = express.Router();

// ================= GET ALL DOCTORS =================
router.get('/doctors', protect, async (req, res) => {
  try {
    const doctors = await User.find({
      role: 'doctor',
      isActive: true,
    }).select('name email specialization avatar');

    res.json(doctors);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ================= GET PROFILE =================
router.get('/profile', protect, attachUser, (req, res) => {
  res.json(req.user);
});

// ================= UPDATE PROFILE =================
router.patch('/profile', protect, attachUser, async (req, res) => {
  try {
    const {
      name,
      phone,
      avatar,
      grade,
      classSection,
      specialization,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    if (grade !== undefined) user.grade = grade;
    if (classSection !== undefined) user.classSection = classSection;

    if (specialization !== undefined && user.role === 'doctor') {
      user.specialization = specialization;
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json(safeUser);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// ================= CHANGE PASSWORD =================
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password incorrect',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

// ================= ADMIN GET ALL USERS =================
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;