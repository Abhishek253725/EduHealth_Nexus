import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['student', 'teacher', 'parent', 'doctor', 'admin']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password, name, role, grade, classSection, specialization, phone } = req.body;
    try {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already registered' });
      const user = await User.create({
        email,
        password,
        name,
        role,
        grade: grade || '',
        classSection: classSection || '',
        specialization: specialization || '',
        phone: phone || '',
      });
      const token = generateToken(user);
      const safe = user.toObject();
      delete safe.password;
      res.status(201).json({ token, user: safe });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findOne({ email: req.body.email }).select('+password');
      if (!user || !(await user.matchPassword(req.body.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });
      const token = generateToken(user);
      const safe = user.toObject();
      delete safe.password;
      res.json({ token, user: safe });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
);

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const safe = user.toObject();
    delete safe.password;
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
