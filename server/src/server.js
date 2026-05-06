import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import parentRoutes from './routes/parentRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import Message from './models/Message.js';
import Notification from './models/Notification.js';
import User from './models/User.js'; // ✅ Add karo

const app = express();
const server = http.createServer(app);

// ✅ Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// ✅ SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ✅ CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ AUTH MIDDLEWARE - Inline
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-me'
    );

    req.userId   = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// ============================================
// ✅ ROUTES
// ============================================
app.get('/', (req, res) => {
  res.json({ ok: true, name: 'EduHealth Nexus API' });
});

app.get('/api/health', (req, res) =>
  res.json({ ok: true, timestamp: new Date().toISOString() })
);

// ✅ USERS FOR MESSAGING - Special route
app.get('/api/users/for-messaging', protect, async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.userId }, // apne aap ko exclude
      isActive: true,
    })
      .select('name email role avatar')
      .sort({ name: 1 });

    console.log(`✅ Users for messaging: ${users.length}`);
    res.json(users);
  } catch (err) {
    console.error('❌ Users error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/courses',        courseRoutes);
app.use('/api/assignments',    assignmentRoutes);
app.use('/api/quizzes',        quizRoutes);
app.use('/api/attendance',     attendanceRoutes);
app.use('/api/parent',         parentRoutes);
app.use('/api/appointments',   appointmentRoutes);
app.use('/api/health-records', healthRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/announcements',  announcementRoutes);
app.use('/api/feedback',       feedbackRoutes);
app.use('/api/messages',       messageRoutes);
app.use('/api/upload',         uploadRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/dashboard',      dashboardRoutes);

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ 
    ok: false, 
    message: `Not found: ${req.method} ${req.originalUrl}` 
  });
});

// ✅ ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ ok: false, message: err.message });
});

// ============================================
// ✅ SOCKET AUTH
// ============================================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.userId   = null;
      socket.userRole = null;
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-me'
    );

    socket.userId   = decoded.id;
    socket.userRole = decoded.role;

    console.log(`✅ Socket Auth | userId: ${socket.userId}`);
    next();
  } catch (err) {
    console.log('❌ Socket Auth Failed:', err.message);
    return next(new Error('Authentication failed'));
  }
});

// ✅ ONLINE USERS
const onlineUsers = new Map();

// ============================================
// ✅ SOCKET CONNECTION
// ============================================
io.on('connection', (socket) => {
  console.log(`🟢 Connected | id: ${socket.id} | userId: ${socket.userId}`);

  if (socket.userId) {
    socket.join(`user:${socket.userId}`);

    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    socket.broadcast.emit('user:online', { userId: socket.userId });
  }

  // ✅ SEND MESSAGE
  socket.on('chat:send', async (data, cb) => {
    try {
      if (!socket.userId) {
        return cb?.({ error: 'Unauthorized' });
      }

      const { receiverId, content } = data || {};

      if (!receiverId || !content?.trim()) {
        return cb?.({ error: 'Invalid data' });
      }

      if (String(receiverId) === String(socket.userId)) {
        return cb?.({ error: 'Cannot message yourself' });
      }

      const msg = await Message.create({
        sender:   socket.userId,
        receiver: receiverId,
        content:  String(content).trim(),
      });

      const populated = await Message.findById(msg._id)
        .populate('sender',   'name avatar role')
        .populate('receiver', 'name avatar role')
        .lean();

      io.to(`user:${receiverId}`).emit('chat:message', populated);
      socket.emit('chat:message', populated);

      try {
        await Notification.create({
          user:  receiverId,
          type:  'message',
          title: 'New Message',
          body:  String(content).slice(0, 140),
          meta:  { from: socket.userId },
        });
      } catch (e) {
        console.error('Notification error:', e.message);
      }

      cb?.({ ok: true, messageId: msg._id });
    } catch (e) {
      console.error('❌ chat:send Error:', e.message);
      cb?.({ error: 'Failed to send message' });
    }
  });

  // ✅ TYPING
  socket.on('chat:typing', ({ receiverId, isTyping }) => {
    if (!socket.userId || !receiverId) return;
    io.to(`user:${receiverId}`).emit('chat:typing', {
      senderId: socket.userId,
      isTyping,
    });
  });

  // ✅ READ
  socket.on('chat:read', async ({ senderId }) => {
    try {
      if (!socket.userId || !senderId) return;
      await Message.updateMany(
        { sender: senderId, receiver: socket.userId, read: false },
        { read: true }
      );
      io.to(`user:${senderId}`).emit('chat:read', { by: socket.userId });
    } catch (e) {
      console.error('chat:read error:', e.message);
    }
  });

  // ✅ DISCONNECT
  socket.on('disconnect', (reason) => {
    console.log(`🔴 Disconnected | ${socket.id} | ${reason}`);

    if (socket.userId) {
      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          socket.broadcast.emit('user:offline', { userId: socket.userId });
        }
      }
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

// ============================================
// ✅ START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log('========================================');
      console.log(`🚀 Server on port ${PORT}`);
      console.log(`🌐 Client: http://localhost:5173`);
      console.log(`🔗 API: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });
  })
  .catch((err) => {
    console.error('❌ DB Failed:', err.message);
    process.exit(1);
  });