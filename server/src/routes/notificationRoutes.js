import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(100);
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, user: req.userId });
    if (!n) return res.status(404).json({ message: 'Not found' });
    n.read = true;
    await n.save();
    res.json(n);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
    res.json({ message: 'OK' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
