import express from 'express';
import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.userRole === 'doctor') filter.doctor = req.userId;
    if (req.userRole === 'student') {
      filter.patient = req.userId;
    } else if (req.userRole === 'parent') {
      if (!req.query.studentId) {
        return res.status(400).json({ message: 'studentId query parameter is required for parents' });
      }
      const parent = await User.findById(req.userId);
      if (!parent.linkedStudents.map((id) => id.toString()).includes(req.query.studentId)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      filter.patient = req.query.studentId;
    }
    if (req.userRole === 'admin') {
      if (req.query.doctorId) filter.doctor = req.query.doctorId;
      if (req.query.patientId) filter.patient = req.query.patientId;
    }
    const list = await Appointment.find(filter)
      .populate('patient', 'name email avatar')
      .populate('doctor', 'name email specialization avatar')
      .sort({ scheduledAt: 1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/', protect, authorize('student', 'parent', 'admin'), async (req, res) => {
  try {
    let patientId = req.userId;
    if (req.userRole === 'parent') {
      patientId = req.body.patientId;
      if (!patientId) return res.status(400).json({ message: 'patientId required' });
      const parent = await User.findById(req.userId);
      if (!parent.linkedStudents.map((id) => id.toString()).includes(patientId)) {
        return res.status(403).json({ message: 'Not linked' });
      }
    }
    const { doctor, scheduledAt, reason } = req.body;
    const doc = await User.findById(doctor);
    if (!doc || doc.role !== 'doctor') return res.status(400).json({ message: 'Invalid doctor' });
    const appt = await Appointment.create({
      patient: patientId,
      doctor,
      scheduledAt: new Date(scheduledAt),
      reason: reason || '',
    });
    await Notification.create({
      user: doctor,
      type: 'appointment',
      title: 'New appointment',
      body: `Booked for ${new Date(scheduledAt).toLocaleString()}`,
      meta: { appointmentId: appt._id },
    });
    await Notification.create({
      user: patientId,
      type: 'appointment',
      title: 'Appointment confirmed',
      body: `With Dr. ${doc.name}`,
      meta: { appointmentId: appt._id },
    });
    res.status(201).json(appt);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Not found' });
    const isDoctor = req.userRole === 'doctor' && appt.doctor.toString() === req.userId;
    const isPatient = appt.patient.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';
    if (!isDoctor && !isPatient && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const { status, notes, scheduledAt } = req.body;
    if (status) appt.status = status;
    if (notes !== undefined && (isDoctor || isAdmin)) appt.notes = notes;
    if (scheduledAt && (isPatient || isAdmin)) appt.scheduledAt = new Date(scheduledAt);
    await appt.save();
    res.json(appt);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
