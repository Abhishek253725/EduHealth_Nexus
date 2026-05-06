import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Course from '../src/models/Course.js';
import Assignment from '../src/models/Assignment.js';
import Quiz from '../src/models/Quiz.js';
import Announcement from '../src/models/Announcement.js';
import Appointment from '../src/models/Appointment.js';
import HealthRecord from '../src/models/HealthRecord.js';
import TeacherFeedback from '../src/models/TeacherFeedback.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduhealth-nexus';

async function run() {
  await mongoose.connect(uri);
  console.log('Seeding...');
  await Promise.all([
    User.deleteMany({ email: /@eduhealth\.test$/ }),
    Course.deleteMany({ title: /^Demo / }),
  ]);

  const admin = await User.create({
    email: 'admin@eduhealth.test',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
  });
  const teacher = await User.create({
    email: 'teacher@eduhealth.test',
    password: 'password123',
    name: 'Anjali Sharma',
    role: 'teacher',
  });
  const student = await User.create({
    email: 'student@eduhealth.test',
    password: 'password123',
    name: 'Arjun Singh',
    role: 'student',
    grade: '10',
    classSection: 'A',
  });
  const parent = await User.create({
    email: 'parent@eduhealth.test',
    password: 'password123',
    name: 'Neha Singh',
    role: 'parent',
  });
  const doctor = await User.create({
    email: 'doctor@eduhealth.test',
    password: 'password123',
    name: 'Dr. Priya Mehta',
    role: 'doctor',
    specialization: 'General Physician',
  });

  parent.linkedStudents.push(student._id);
  await parent.save();
  student.parentIds.push(parent._id);
  await student.save();

  const course1 = await Course.create({
    title: 'Demo Mathematics',
    description: 'Algebra and calculus basics',
    subject: 'Mathematics',
    teacher: teacher._id,
    enrollments: [{ student: student._id, progress: 75, averageScore: 82 }],
  });
  const course2 = await Course.create({
    title: 'Demo Physics',
    description: 'Mechanics',
    subject: 'Physics',
    teacher: teacher._id,
    enrollments: [{ student: student._id, progress: 60, averageScore: 78 }],
  });

  const due = new Date();
  due.setDate(due.getDate() + 5);
  await Assignment.create({
    course: course1._id,
    teacher: teacher._id,
    title: 'Demo Calculus Problem Set',
    description: 'Submit worked solutions',
    dueDate: due,
    submissions: [],
  });

  await Quiz.create({
    course: course2._id,
    teacher: teacher._id,
    title: 'Demo Physics Quiz',
    dueDate: due,
    questions: [
      {
        text: 'F = ma is known as?',
        options: ["Newton's 2nd law", 'Ohm law', 'Boyle law', 'Snell law'],
        correctIndex: 0,
      },
    ],
    attempts: [],
  });

  await Announcement.create({
    course: course1._id,
    author: teacher._id,
    title: 'Mid-term schedule',
    body: 'Exams start next month — check portal.',
  });

  const apptTime = new Date();
  apptTime.setDate(apptTime.getDate() + 3);
  apptTime.setHours(10, 0, 0, 0);
  await Appointment.create({
    patient: student._id,
    doctor: doctor._id,
    scheduledAt: apptTime,
    reason: 'General Checkup',
    status: 'scheduled',
  });

  await HealthRecord.create({
    patient: student._id,
    doctor: doctor._id,
    heartRate: 72,
    bloodPressure: '120/80',
    bloodGroup: 'B+',
    allergies: 'None',
    notes: 'Routine vitals',
  });

  await TeacherFeedback.create({
    student: student._id,
    teacher: teacher._id,
    course: course1._id,
    message: 'Arjun is very consistent in his work and shows great interest in learning.',
  });

  console.log('Seed complete. Test accounts (password: password123):');
  console.table([
    { email: admin.email, role: admin.role },
    { email: teacher.email, role: teacher.role },
    { email: student.email, role: student.role },
    { email: parent.email, role: parent.role },
    { email: doctor.email, role: doctor.role },
  ]);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
