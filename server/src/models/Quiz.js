import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0 },
});

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ type: Number }],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
});

const quizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    dueDate: { type: Date },
    questions: [questionSchema],
    attempts: [attemptSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
