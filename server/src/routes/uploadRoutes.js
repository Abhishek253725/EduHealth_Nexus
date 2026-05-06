import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { uploadBuffer } from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const result = await uploadBuffer(req.file.buffer, 'eduhealth');
    if (result.skipped) {
      return res.status(503).json({
        message: 'Cloudinary not configured. Set CLOUDINARY_* env vars or use a direct URL in the client.',
        url: '',
      });
    }
    res.json({ url: result.url, publicId: result.publicId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
