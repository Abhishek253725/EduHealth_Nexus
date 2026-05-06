import express from 'express';
import Course from '../models/Course.js';
import Assignment from '../models/Assignment.js';
import Quiz from '../models/Quiz.js';
import Appointment from '../models/Appointment.js';
import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import Announcement from '../models/Announcement.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    const role = req.userRole;
    const uid = req.userId;

    // ================= STUDENT =================
    if (role === 'student') {
      const courses = await Course.find({
        'enrollments.student': uid,
      }).populate('teacher', 'name');

      const courseIds = courses.map((c) => c._id);

      const [
        assignments,
        quizzes,
        announcements,
        nextAppt,
        latestHealth,
      ] = await Promise.all([
        Assignment.find({
          course: { $in: courseIds },
        })
          .populate('course', 'title')
          .sort({ dueDate: 1 }),

        Quiz.find({
          course: { $in: courseIds },
        }).sort({ dueDate: 1 }),

        Announcement.find({
          course: { $in: courseIds },
        })
          .sort({ createdAt: -1 })
          .limit(5),

        Appointment.findOne({
          patient: uid,
          scheduledAt: { $gte: new Date() },
          status: 'scheduled',
        })
          .sort({ scheduledAt: 1 })
          .populate('doctor', 'name'),

        HealthRecord.findOne({ patient: uid }).sort({
          visitDate: -1,
        }),
      ]);

      // pending assignments only
      const dueAssignments = assignments.filter((a) => {
        const alreadySubmitted = a.submissions.some(
          (s) => s.student.toString() === uid
        );

        return !alreadySubmitted && new Date(a.dueDate) >= new Date();
      });

      // pending quizzes only
      const upcomingQuizzes = quizzes.filter((q) => {
        const attempted = q.attempts.some(
          (a) => a.student.toString() === uid
        );
        return !attempted;
      });

      // average score
      let totalScore = 0;
      let totalCount = 0;

      assignments.forEach((a) => {
        const sub = a.submissions.find(
          (s) => s.student.toString() === uid
        );

        if (sub?.score !== null && sub?.score !== undefined) {
          totalScore += sub.score;
          totalCount++;
        }
      });

      quizzes.forEach((q) => {
        const att = q.attempts.find(
          (a) => a.student.toString() === uid
        );

        if (att?.score !== null && att?.score !== undefined) {
          totalScore += att.score;
          totalCount++;
        }
      });

      const averageScore = totalCount
        ? Math.round(totalScore / totalCount)
        : 0;

      // fallback announcements
      let finalAnnouncements = announcements;

      if (finalAnnouncements.length === 0) {
        finalAnnouncements = assignments.slice(0, 5).map((a) => ({
          _id: a._id,
          title: `New assignment: ${a.title}`,
          createdAt: a.createdAt || new Date(),
        }));
      }

      return res.json({
        role,
        stats: {
          enrolledCourses: courses.length,
          assignmentsDue: dueAssignments.length,
          quizUpcoming: upcomingQuizzes.length,
          averageScore,
        },
        courses,
        deadlines: dueAssignments.slice(0, 5),
        announcements: finalAnnouncements,
        nextAppointment: nextAppt,
        health: latestHealth,
      });
    }

    // ================= TEACHER =================
    if (role === 'teacher') {
      const courses = await Course.find({ teacher: uid });
      const courseIds = courses.map((c) => c._id);

      let studentCount = 0;
      courses.forEach((c) => {
        studentCount += c.enrollments.length;
      });

      const assignments = await Assignment.find({
        course: { $in: courseIds },
      })
        .sort({ dueDate: -1 })
        .limit(10);

      const announcements = await Announcement.find({
        course: { $in: courseIds },
      })
        .sort({ createdAt: -1 })
        .limit(5);

      return res.json({
        role,
        stats: {
          courses: courses.length,
          students: studentCount,
          assignments: assignments.length,
        },
        courses,
        recentAssignments: assignments,
        announcements,
      });
    }

    // ================= DOCTOR =================
    if (role === 'doctor') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const todayAppointments = await Appointment.find({
        doctor: uid,
        scheduledAt: {
          $gte: start,
          $lte: end,
        },
      })
        .populate('patient', 'name')
        .sort({ scheduledAt: 1 });

      const totalPatients = await Appointment.distinct('patient', {
        doctor: uid,
      });

      const upcoming = await Appointment.countDocuments({
        doctor: uid,
        status: 'scheduled',
        scheduledAt: {
          $gte: new Date(),
        },
      });

      const recentPatients = await HealthRecord.find({
        doctor: uid,
      })
        .populate('patient', 'name')
        .sort({ visitDate: -1 })
        .limit(5);

      return res.json({
        role,
        stats: {
          todayCount: todayAppointments.length,
          totalPatients: totalPatients.length,
          upcoming,
        },
        todayAppointments,
        recentPatients,
      });
    }

    // ================= PARENT =================
    if (role === 'parent') {
      const parent = await User.findById(uid).populate(
        'linkedStudents',
        'name'
      );

      return res.json({
        role,
        children: parent.linkedStudents || [],
      });
    }

    // ================= ADMIN =================
    if (role === 'admin') {
      return res.json({
        role,
        stats: {
          users: await User.countDocuments(),
          courses: await Course.countDocuments(),
          appointments: await Appointment.countDocuments(),
        },
      });
    }

    res.json({ role });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
});

export default router;