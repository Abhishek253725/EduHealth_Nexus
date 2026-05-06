import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    visitDate: { type: Date, default: Date.now },
    heartRate: { type: Number },
    bloodPressure: { type: String, default: '' },
    bloodGroup: { type: String, default: '' },
    allergies: { type: String, default: 'None' },
    symptoms: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('HealthRecord', healthRecordSchema);
