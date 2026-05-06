import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'note', 'file'], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledAt: { type: Date, default: Date.now },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  averageScore: { type: Number, min: 0, max: 100, default: 0 },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, default: '' },
    materials: [materialSchema],
    enrollments: [enrollmentSchema],
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ teacher: 1, title: 1 });

export default mongoose.model('Course', courseSchema);
