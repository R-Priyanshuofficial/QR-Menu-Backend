const printerService = require('../utils/printerService');

/**
 * @desc    Print bill to thermal printer
 * @route   POST /api/printer/print
 * @access  Private (Owner)
 */
exports.printBill = async (req, res) => {
  try {
    const { bill, printerSettings, type } = req.body;

    // Validate required fields
    if (!bill) {
      return res.status(400).json({
        success: false,
        message: 'Bill data is required'
      });
    }

    if (!printerSettings) {
      return res.status(400).json({
        success: false,
        message: 'Printer settings are required'
      });
    }

    // Validate printer settings
    if (!printerSettings.type || !printerSettings.connection) {
      return res.status(400).json({
        success: false,
        message: 'Invalid printer settings: type and connection required'
      });
    }

    // Validate connection details based on type
    if (printerSettings.type === 'usb' && !printerSettings.connection.usbPort) {
      return res.status(400).json({
        success: false,
        message: 'USB port is required for USB printer'
      });
    }

    if (printerSettings.type === 'network') {
      if (!printerSettings.connection.networkIp || !printerSettings.connection.networkPort) {
        return res.status(400).json({
          success: false,
          message: 'IP address and port are required for network printer'
        });
      }
    }

    console.log(`📄 Printing bill for ${bill.customerName || 'Guest'}...`);
    console.log(`🖨️ Printer type: ${printerSettings.type}`);

    // Print the bill
    const result = await printerService.printBill(bill, printerSettings);

    return res.status(200).json({
      success: true,
      message: result.message || 'Bill printed successfully',
      printerId: type || 'billing',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Print bill controller error:', error);
    
    // Determine error type and send appropriate response
    let statusCode = 500;
    let message = 'Failed to print bill';

    if (error.message.includes('not found') || error.message.includes('not reachable')) {
      statusCode = 404;
      message = 'Printer not connected or not found';
    } else if (error.message.includes('permission') || error.message.includes('access')) {
      statusCode = 403;
      message = 'Permission denied to access printer';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: error.message,
      code: error.code || 'PRINT_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Test printer connection
 * @route   POST /api/printer/test
 * @access  Private (Owner)
 */
exports.testPrinter = async (req, res) => {
  try {
    const { type, connection } = req.body;

    // Validate required fields
    if (!type || !connection) {
      return res.status(400).json({
        success: false,
        message: 'Printer type and connection details are required'
      });
    }

    // Validate connection details based on type
    if (type === 'usb' && !connection.usbPort) {
      return res.status(400).json({
        success: false,
        message: 'USB port is required'
      });
    }

    if (type === 'network') {
      if (!connection.networkIp || !connection.networkPort) {
        return res.status(400).json({
          success: false,
          message: 'IP address and port are required'
        });
      }
    }

    console.log(`🧪 Testing printer connection: ${type}`);
    
    if (type === 'usb') {
      console.log(`   Port: ${connection.usbPort}`);
    } else if (type === 'network') {
      console.log(`   IP: ${connection.networkIp}:${connection.networkPort}`);
    }

    // Test the printer
    const result = await printerService.testPrinter({ type, connection });

    return res.status(200).json({
      success: true,
      message: result.message || 'Printer test successful',
      printerInfo: {
        type,
        status: 'online',
        connection: type === 'usb' 
          ? { port: connection.usbPort }
          : { ip: connection.networkIp, port: connection.networkPort }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Printer test controller error:', error);

    // Determine error type
    let statusCode = 500;
    let message = 'Printer test failed';

    if (error.message.includes('not found') || error.message.includes('not reachable')) {
      statusCode = 404;
      message = 'Printer not connected. Check connection and try again.';
    } else if (error.message.includes('ECONNREFUSED')) {
      statusCode = 503;
      message = 'Connection refused. Printer may be offline.';
    } else if (error.message.includes('ETIMEDOUT')) {
      statusCode = 504;
      message = 'Connection timeout. Check IP address and network.';
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: error.message,
      code: error.code || 'TEST_FAILED',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @desc    Get printer status
 * @route   GET /api/printer/status
 * @access  Private (Owner)
 */
exports.getPrinterStatus = async (req, res) => {
  try {
    // This is a simple status endpoint
    // In production, you might want to check actual printer connectivity
    return res.status(200).json({
      success: true,
      message: 'Printer service is running',
      status: 'ready',
      supportedTypes: ['usb', 'network'],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Printer status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get printer status',
      error: error.message
    });
  }
};
