import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
});

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },

    // ✅ ADD THIS
    fileUrl: {
      type: String,
      default: '',
    },

    dueDate: {
      type: Date,
      required: true,
    },

    submissions: [submissionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Assignment', assignmentSchema);