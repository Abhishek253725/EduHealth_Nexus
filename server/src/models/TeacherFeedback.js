import mongoose from 'mongoose';

const teacherFeedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('TeacherFeedback', teacherFeedbackSchema);
