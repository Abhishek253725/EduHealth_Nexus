import express from 'express';
import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.userRole === 'student') filter.patient = req.userId;
    else if (req.userRole === 'parent' && req.query.studentId) {
      const parent = await User.findById(req.userId);
      if (!parent.linkedStudents.map((id) => id.toString()).includes(req.query.studentId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      filter.patient = req.query.studentId;
    } else if (req.userRole === 'doctor') {
      filter.doctor = req.userId;
      if (req.query.patientId) filter.patient = req.query.patientId;
    } else if (req.userRole === 'admin') {
      if (req.query.patientId) filter.patient = req.query.patientId;
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const list = await HealthRecord.find(filter)
      .populate('patient', 'name email avatar')
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const {
      patient,
      visitDate,
      heartRate,
      bloodPressure,
      bloodGroup,
      allergies,
      symptoms,
      notes,
    } = req.body;
    const p = await User.findById(patient);
    if (!p) return res.status(400).json({ message: 'Invalid patient' });
    const rec = await HealthRecord.create({
      patient,
      doctor: req.userId,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      heartRate,
      bloodPressure,
      bloodGroup,
      allergies,
      symptoms,
      notes,
    });
    res.status(201).json(rec);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
