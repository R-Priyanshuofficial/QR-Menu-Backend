const mongoose = require('mongoose');

console.log('🔍 Testing MongoDB Connection...\n');

const testConnection = async () => {
  try {
    console.log('📡 Attempting connection to: mongodb://127.0.0.1:27017/qr-menu');
    console.log('⏱️  Timeout: 5 seconds\n');

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect('mongodb://127.0.0.1:27017/qr-menu', options);

    console.log('✅ SUCCESS! MongoDB Connected');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Ready State: ${conn.connection.readyState}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ CONNECTION FAILED');
    console.error(`Error: ${error.message}`);
    console.error(`\nDiagnostics:`);
    console.error(`- MongoDB Service Status: Check with 'Get-Service MongoDB'`);
    console.error(`- Port Listening: Check with 'netstat -ano | findstr :27017'`);
    console.error(`- Firewall: MongoDB might be blocked by Windows Firewall`);
    console.error(`- Config File: C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.cfg`);
    process.exit(1);
  }
};

testConnection();
