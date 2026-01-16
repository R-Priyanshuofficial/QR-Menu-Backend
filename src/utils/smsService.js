const twilio = require('twilio');

// Initialize Twilio client (optional - only if credentials are provided)
let twilioClient = null;
const TWILIO_ENABLED = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

if (TWILIO_ENABLED) {
  try {
    // Validate Account SID format
    if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.warn('⚠️ Twilio Account SID must start with "AC". Skipping Twilio initialization.');
      twilioClient = null;
    } else {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log('✅ Twilio SMS service initialized');
    }
  } catch (error) {
    console.error('❌ Twilio initialization failed:', error.message);
  }
}

/**
 * Send SMS notification to customer
 * @param {string} phone - Customer phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - SMS sending result
 */
const sendSMS = async (phone, message) => {
  // If Twilio is not configured, log the message instead
  if (!TWILIO_ENABLED || !twilioClient) {
    console.log('\n📱 SMS SIMULATION (Twilio not configured):');
    console.log('─────────────────────────────────────');
    console.log(`📞 To: ${phone}`);
    console.log(`💬 Message: ${message}`);
    console.log('─────────────────────────────────────\n');
    
    return {
      success: true,
      simulated: true,
      message: 'SMS simulated (Twilio not configured)',
      phone,
      text: message
    };
  }

  try {
    // Format phone number (add country code if not present)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      // Assume Indian number (+91) if no country code
      formattedPhone = `+91${phone}`;
    }

    // Send SMS via Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ SMS sent to ${formattedPhone}: ${result.sid}`);

    return {
      success: true,
      simulated: false,
      messageId: result.sid,
      phone: formattedPhone,
      status: result.status
    };
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${phone}:`, error.message);
    
    return {
      success: false,
      error: error.message,
      phone
    };
  }
};

/**
 * Send order ready notification to customer
 */
const sendOrderReadyNotification = async (phone, orderNumber, customerName) => {
  const message = `🎉 Hi ${customerName}! Your order #${orderNumber} is ready for pickup. Thank you for your patience! - QR Menu`;
  return await sendSMS(phone, message);
};

/**
 * Send new order confirmation to customer
 */
const sendOrderConfirmation = async (phone, orderNumber, customerName, totalAmount) => {
  const message = `✅ Thank you ${customerName}! Your order #${orderNumber} (₹${totalAmount}) has been received. We'll notify you when it's ready!`;
  return await sendSMS(phone, message);
};

/**
 * Send order status update to customer
 */
const sendOrderStatusUpdate = async (phone, orderNumber, status, customerName) => {
  const statusMessages = {
    preparing: `👨‍🍳 Hi ${customerName}! Your order #${orderNumber} is being prepared.`,
    ready: `🎉 Hi ${customerName}! Your order #${orderNumber} is ready for pickup!`,
    completed: `💚 Thank you ${customerName}! Your order #${orderNumber} has been completed. We hope to see you again!`,
    cancelled: `😔 Hi ${customerName}, your order #${orderNumber} has been cancelled. Please contact us for more details.`
  };

  const message = statusMessages[status] || `Order #${orderNumber} status: ${status}`;
  return await sendSMS(phone, message);
};

/**
 * Send notification to owner about new order
 */
const sendNewOrderNotification = async (ownerPhone, orderNumber, customerName, totalAmount) => {
  if (!ownerPhone) return { success: false, message: 'Owner phone not provided' };
  
  const message = `🔔 New Order #${orderNumber}! Customer: ${customerName}, Amount: ₹${totalAmount}. Check your dashboard now!`;
  return await sendSMS(ownerPhone, message);
};

module.exports = {
  sendSMS,
  sendOrderReadyNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendNewOrderNotification,
  isEnabled: () => TWILIO_ENABLED
};
