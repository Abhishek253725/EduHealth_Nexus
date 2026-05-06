import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);
