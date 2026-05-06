import express from 'express';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/conversations', protect, async (req, res) => {
  try {
    const uid = req.userId;
    const msgs = await Message.find({
      $or: [{ sender: uid }, { receiver: uid }],
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .populate('sender', 'name role avatar')
      .populate('receiver', 'name role avatar');
    const partnerMap = new Map();
    for (const m of msgs) {
      const other = m.sender._id.toString() === uid ? m.receiver : m.sender;
      const oid = other._id.toString();
      if (!partnerMap.has(oid)) partnerMap.set(oid, { user: other, lastMessage: m });
    }
    res.json([...partnerMap.values()]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const list = await Message.find({
      $or: [
        { sender: req.userId, receiver: userId },
        { sender: userId, receiver: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar');
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const m = await Message.create({ sender: req.userId, receiver, content });
    const populated = await Message.findById(m._id)
      .populate('sender', 'name avatar role')
      .populate('receiver', 'name avatar role');
    res.status(201).json(populated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
