const mongoose = require('mongoose');

// Suppress strictQuery warning
mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    console.log(`   URI: ${process.env.MONGODB_URI}`);
    
    // Minimal connection options - let Mongoose handle defaults
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4 // Force IPv4
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error(`💡 MongoDB seems to be running but connection is failing.`);
    console.error(`   This can happen when MongoDB is busy or has too many connections.`);
    console.error(`   The app will continue running without database access.`);
    // Don't exit in development, let nodemon restart
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;


