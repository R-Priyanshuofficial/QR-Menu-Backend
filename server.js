const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const { initializeSocket } = require('./src/config/socket');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Connect to Database
connectDB();

// Middleware
// Simple CORS: mirror any origin in development; in production mirror only FRONTEND_URL if set
app.use(cors({
  origin: (origin, cb) => {
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    const allowed = process.env.FRONTEND_URL;
    if (!origin || !allowed) return cb(null, true);
    if (origin === allowed) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for avatars and uploads
app.use('/avatars', express.static('public/avatars'));
app.use('/uploads', express.static('uploads'));



// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'QR Menu API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/qr', require('./src/routes/qrRoutes'));
app.use('/api/qr', require('./src/routes/qrDesignRoutes')); // AI design generation
app.use('/api/menu', require('./src/routes/menuRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/printer', require('./src/routes/printerRoutes')); // Thermal printer routes
app.use('/api/test', require('./src/routes/testRoutes')); // Test/Debug routes
app.use('/api/debug', require('./src/routes/debugRoutes')); // Debug endpoints
app.use('/api/push', require('./src/routes/pushRoutes'));
app.use('/api/staff', require('./src/routes/staffRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error Handler Middleware (must be last)
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const getLanIp = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return '127.0.0.1';
};

server.listen(PORT, '0.0.0.0', () => {
  const lan = getLanIp();
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://${lan}:${PORT}`);
  console.log(`📚 API Docs: Check API_DOCUMENTATION.md`);
  console.log(`🔔 Socket.io notifications enabled\n`);
});

// Handle port already in use error
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Run: npm run dev:clean`);
    console.error(`   2. Double-click: start.bat`);
    console.error(`   3. Kill manually: netstat -ano | findstr :${PORT}\n`);
    process.exit(1);
  } else {
    throw error;
  }
});
