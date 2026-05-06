import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'parent', 'doctor', 'admin'],
      required: true,
    },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    grade: { type: String, default: '' },
    classSection: { type: String, default: '' },
    parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    specialization: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
