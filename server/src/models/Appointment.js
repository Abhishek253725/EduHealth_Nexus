import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    reason: { type: String, default: '' },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Appointment', appointmentSchema);
