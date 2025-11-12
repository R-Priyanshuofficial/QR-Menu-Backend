/**
 * Thermal Printer Setup Verification Script
 * Run this to verify printer dependencies are installed correctly
 */

console.log('\n🔍 Verifying Thermal Printer Setup...\n');

const checks = [];

// Check 1: node-thermal-printer
try {
  require('node-thermal-printer');
  checks.push({ name: 'node-thermal-printer', status: '✅', message: 'Installed' });
} catch (e) {
  checks.push({ name: 'node-thermal-printer', status: '❌', message: 'Missing' });
}

// Check 2: escpos
try {
  require('escpos');
  checks.push({ name: 'escpos', status: '✅', message: 'Installed' });
} catch (e) {
  checks.push({ name: 'escpos', status: '❌', message: 'Missing' });
}

// Check 3: escpos-usb
try {
  require('escpos-usb');
  checks.push({ name: 'escpos-usb', status: '✅', message: 'Installed' });
} catch (e) {
  checks.push({ name: 'escpos-usb', status: '❌', message: 'Missing' });
}

// Check 4: escpos-network
try {
  require('escpos-network');
  checks.push({ name: 'escpos-network', status: '✅', message: 'Installed' });
} catch (e) {
  checks.push({ name: 'escpos-network', status: '❌', message: 'Missing' });
}

// Check 5: serialport
try {
  require('serialport');
  checks.push({ name: 'serialport', status: '✅', message: 'Installed' });
} catch (e) {
  checks.push({ name: 'serialport', status: '❌', message: 'Missing' });
}

// Check 6: Printer Service
try {
  require('./src/utils/printerService');
  checks.push({ name: 'Printer Service', status: '✅', message: 'Loaded successfully' });
} catch (e) {
  checks.push({ name: 'Printer Service', status: '❌', message: e.message });
}

// Check 7: Printer Controller
try {
  require('./src/controllers/printerController');
  checks.push({ name: 'Printer Controller', status: '✅', message: 'Loaded successfully' });
} catch (e) {
  checks.push({ name: 'Printer Controller', status: '❌', message: e.message });
}

// Check 8: Printer Routes
try {
  require('./src/routes/printerRoutes');
  checks.push({ name: 'Printer Routes', status: '✅', message: 'Loaded successfully' });
} catch (e) {
  checks.push({ name: 'Printer Routes', status: '❌', message: e.message });
}

// Print Results
console.log('╔════════════════════════════════════════════════╗');
console.log('║      Thermal Printer Setup Verification       ║');
console.log('╚════════════════════════════════════════════════╝\n');

checks.forEach(check => {
  const padding = 25 - check.name.length;
  console.log(`${check.status} ${check.name}${' '.repeat(padding)}: ${check.message}`);
});

const allPassed = checks.every(check => check.status === '✅');
const failed = checks.filter(check => check.status === '❌');

console.log('\n' + '═'.repeat(50) + '\n');

if (allPassed) {
  console.log('🎉 SUCCESS! All printer dependencies installed!\n');
  console.log('✅ Backend is ready for thermal printing');
  console.log('✅ You can now start the server with: npm run dev\n');
} else {
  console.log('⚠️  INCOMPLETE SETUP\n');
  console.log(`❌ ${failed.length} issue(s) found:\n`);
  failed.forEach(check => {
    console.log(`   • ${check.name}: ${check.message}`);
  });
  console.log('\n💡 To fix, run:');
  console.log('   npm install node-thermal-printer escpos escpos-usb escpos-network serialport\n');
}

process.exit(allPassed ? 0 : 1);
