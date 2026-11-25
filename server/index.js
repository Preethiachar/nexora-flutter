require('dotenv').config();
require('express-async-errors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const fs = require('fs');

// Route imports
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const marketplaceRoutes = require('./routes/marketplace');
const messageRoutes = require('./routes/messages');
const aiRoutes = require('./routes/ai');
const searchRoutes = require('./routes/search');
const feedRoutes = require('./routes/feed');

const app = express();
const httpServer = http.createServer(app);

const allowedOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    origin === (process.env.CLIENT_URL || 'http://localhost:3000') ||
    /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin) ||
    /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS'));
};

// ─── Socket.io Setup ────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents, images, and resumes statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Live Flutter Phone Frame page
app.get('/phone', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/phone.html'));
});

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/feed', feedRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), platform: 'Nexora v1.1' });
});

// Serve built Flutter Web app at root (for Render / production single-URL deployment)
const flutterWebDir = path.join(__dirname, 'public/flutter');
if (fs.existsSync(flutterWebDir)) {
  app.use(express.static(flutterWebDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(flutterWebDir, 'index.html'));
  });
}

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Socket.io Event Handlers ────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(groupId);
  });

  socket.on('send_message', (data) => {
    io.to(data.groupId).emit('new_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.groupId).emit('user_typing', {
      userId: data.userId,
      userName: data.userName,
    });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ─── MongoDB Connection & Server Start ───────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora')
  .then(() => {
    console.log('[DB] MongoDB connected successfully');
    httpServer.listen(PORT, () => {
      console.log(`[Server] Nexora API running on http://localhost:${PORT}`);
      console.log('[Server] Socket.io ready');
    });
  })
  .catch((err) => {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = { app, io };
