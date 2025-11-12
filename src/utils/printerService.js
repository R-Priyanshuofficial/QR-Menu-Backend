const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');
const escpos = require('escpos');
const USB = require('escpos-usb');
const Network = require('escpos-network');

/**
 * Production-Ready Thermal Printer Service
 * Supports USB, Network, and Bluetooth printers
 */

class PrinterService {
  constructor() {
    this.activePrinters = new Map(); // Cache active printer connections
  }

  /**
   * Create thermal printer instance based on configuration
   */
  async createPrinter(settings) {
    const { type, connection } = settings;

    try {
      let printer;

      if (type === 'usb') {
        printer = await this.createUSBPrinter(connection.usbPort);
      } else if (type === 'network') {
        printer = await this.createNetworkPrinter(connection.networkIp, connection.networkPort);
      } else {
        throw new Error(`Unsupported printer type: ${type}`);
      }

      return printer;
    } catch (error) {
      console.error('❌ Failed to create printer:', error);
      throw error;
    }
  }

  /**
   * Create USB thermal printer
   */
  async createUSBPrinter(port) {
    try {
      // Determine interface based on OS
      const isWindows = process.platform === 'win32';
      const printerInterface = isWindows 
        ? `//./COM${port.replace('COM', '')}`  // Windows: //./COM3
        : port;  // Linux: /dev/usb/lp0

      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: printerInterface,
        width: 48,  // 80mm paper = 48 characters
        characterSet: 'PC437_USA',
        removeSpecialCharacters: false,
        lineCharacter: '-',
      });

      const isConnected = await printer.isPrinterConnected();
      
      if (!isConnected) {
        throw new Error(`USB printer not found at ${port}`);
      }

      console.log(`✅ USB Printer connected: ${port}`);
      return printer;
    } catch (error) {
      console.error(`❌ USB Printer error (${port}):`, error.message);
      throw new Error(`Failed to connect to USB printer at ${port}: ${error.message}`);
    }
  }

  /**
   * Create Network thermal printer
   */
  async createNetworkPrinter(ip, port = 9100) {
    try {
      const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `tcp://${ip}:${port}`,
        width: 48,
        characterSet: 'PC437_USA',
        removeSpecialCharacters: false,
        lineCharacter: '-',
      });

      const isConnected = await printer.isPrinterConnected();
      
      if (!isConnected) {
        throw new Error(`Network printer not reachable at ${ip}:${port}`);
      }

      console.log(`✅ Network Printer connected: ${ip}:${port}`);
      return printer;
    } catch (error) {
      console.error(`❌ Network Printer error (${ip}:${port}):`, error.message);
      throw new Error(`Failed to connect to network printer at ${ip}:${port}: ${error.message}`);
    }
  }

  /**
   * Print bill to thermal printer
   */
  async printBill(bill, printerSettings) {
    try {
      const printer = await this.createPrinter(printerSettings);
      
      // Header
      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.bold(true);
      
      // Restaurant name from bill or default
      const restaurantName = bill.restaurantName || 'QR Menu Restaurant';
      printer.println(restaurantName.toUpperCase());
      printer.bold(false);
      printer.setTextNormal();

      // Restaurant details
      if (bill.restaurantInfo) {
        if (bill.restaurantInfo.address) {
          printer.println(bill.restaurantInfo.address);
        }
        if (bill.restaurantInfo.phone) {
          printer.println(`Ph: ${bill.restaurantInfo.phone}`);
        }
        if (bill.restaurantInfo.gstNumber) {
          printer.setTextSize(0, 0);
          printer.println(`GSTIN: ${bill.restaurantInfo.gstNumber}`);
          printer.setTextNormal();
        }
      }

      printer.println('Thank you for your order!');
      printer.println('--- TAX INVOICE ---');
      printer.drawLine();

      // Bill details
      printer.alignLeft();
      printer.println(`Date: ${new Date(bill.lastOrderDate || new Date()).toLocaleDateString()}`);
      printer.println(`Time: ${new Date(bill.lastOrderDate || new Date()).toLocaleTimeString()}`);
      printer.println(`Bill #: ${bill.id ? bill.id.slice(-8).toUpperCase() : 'N/A'}`);
      printer.newLine();

      // Customer info
      printer.println(`Customer: ${bill.customerName || 'Guest'}`);
      printer.println(`Phone: ${bill.customerPhone || 'N/A'}`);
      printer.println(`Orders: ${bill.orders ? bill.orders.length : 1}`);
      printer.drawLine();

      // Items
      printer.bold(true);
      printer.println('ITEMS:');
      printer.bold(false);

      // Get all items
      const allItems = bill.orders 
        ? bill.orders.flatMap(order => order.items || [])
        : (bill.items || []);

      allItems.forEach(item => {
        printer.println(item.name);
        const qtyLine = `  ${item.quantity} x Rs.${parseFloat(item.price).toFixed(2)}`;
        const total = `Rs.${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}`;
        printer.leftRight(qtyLine, total);
      });

      printer.drawLine();

      // Totals
      const subtotal = parseFloat(bill.subtotal || 0);
      printer.leftRight('Subtotal:', `Rs.${subtotal.toFixed(2)}`);

      // GST if enabled
      if (bill.gst && bill.gst.enabled) {
        if (bill.gst.showBreakdown) {
          printer.leftRight(
            `CGST (${bill.gst.cgstRate}%):`,
            `Rs.${parseFloat(bill.gst.cgst || 0).toFixed(2)}`
          );
          printer.leftRight(
            `SGST (${bill.gst.sgstRate}%):`,
            `Rs.${parseFloat(bill.gst.sgst || 0).toFixed(2)}`
          );
        } else {
          printer.leftRight(
            `GST (${bill.gst.totalRate}%):`,
            `Rs.${parseFloat(bill.gst.total || 0).toFixed(2)}`
          );
        }
      }

      printer.newLine();
      
      // Total
      printer.setTextDoubleHeight();
      printer.bold(true);
      const totalAmount = parseFloat(bill.totalAmount || subtotal);
      printer.leftRight('TOTAL:', `Rs.${totalAmount.toFixed(2)}`);
      printer.bold(false);
      printer.setTextNormal();

      printer.drawLine();

      // Footer
      printer.alignCenter();
      printer.println(`Total Items: ${bill.itemCount || allItems.length}`);
      
      if (bill.gst && bill.gst.enabled) {
        printer.setTextSize(0, 0);
        printer.println(`Tax: ${bill.gst.totalRate}% (CGST: ${bill.gst.cgstRate}% + SGST: ${bill.gst.sgstRate}%)`);
        printer.setTextNormal();
      }

      printer.newLine();
      printer.println('*** Thank You! Visit Again ***');
      printer.setTextSize(0, 0);
      printer.println('Powered by QR Menu System');
      printer.setTextNormal();
      printer.newLine();
      printer.newLine();
      printer.newLine();

      // Cut paper
      printer.cut();

      // Execute print
      await printer.execute();
      
      console.log(`✅ Bill printed successfully: ${bill.id || 'N/A'}`);
      
      // Clear the printer instance
      printer.clear();
      
      return { success: true, message: 'Bill printed successfully' };

    } catch (error) {
      console.error('❌ Print bill error:', error);
      throw error;
    }
  }

  /**
   * Test printer connection
   */
  async testPrinter(printerSettings) {
    try {
      const printer = await this.createPrinter(printerSettings);

      // Print test page
      printer.alignCenter();
      printer.bold(true);
      printer.setTextDoubleHeight();
      printer.println('PRINTER TEST');
      printer.bold(false);
      printer.setTextNormal();
      
      printer.println('Connection successful!');
      printer.newLine();
      
      const now = new Date();
      printer.println(now.toLocaleDateString());
      printer.println(now.toLocaleTimeString());
      printer.newLine();

      // Printer info
      printer.alignLeft();
      printer.println('Configuration:');
      printer.println(`Type: ${printerSettings.type.toUpperCase()}`);
      
      if (printerSettings.type === 'usb') {
        printer.println(`Port: ${printerSettings.connection.usbPort}`);
      } else if (printerSettings.type === 'network') {
        printer.println(`IP: ${printerSettings.connection.networkIp}`);
        printer.println(`Port: ${printerSettings.connection.networkPort}`);
      }
      
      printer.alignCenter();
      printer.newLine();
      printer.println('--- Test Complete ---');
      printer.newLine();
      printer.newLine();
      
      printer.cut();
      await printer.execute();
      
      console.log('✅ Printer test successful');
      printer.clear();
      
      return { success: true, message: 'Test print successful' };

    } catch (error) {
      console.error('❌ Printer test error:', error);
      throw error;
    }
  }

  /**
   * Alternative: Print using ESC/POS directly (more control)
   */
  async printBillESCPOS(bill, printerSettings) {
    return new Promise((resolve, reject) => {
      try {
        let device;
        
        if (printerSettings.type === 'usb') {
          device = new USB();
        } else if (printerSettings.type === 'network') {
          device = new Network(printerSettings.connection.networkIp, printerSettings.connection.networkPort);
        } else {
          return reject(new Error('Unsupported printer type for ESC/POS'));
        }

        const printer = new escpos.Printer(device);

        device.open(function(error) {
          if (error) {
            console.error('ESC/POS device open error:', error);
            return reject(error);
          }

          try {
            const restaurantName = bill.restaurantInfo?.name || 'QR Menu Restaurant';
            
            printer
              .font('a')
              .align('ct')
              .style('bu')
              .size(2, 2)
              .text(restaurantName.toUpperCase())
              .size(1, 1)
              .style('normal');

            if (bill.restaurantInfo) {
              if (bill.restaurantInfo.address) printer.text(bill.restaurantInfo.address);
              if (bill.restaurantInfo.phone) printer.text(`Ph: ${bill.restaurantInfo.phone}`);
              if (bill.restaurantInfo.gstNumber) printer.text(`GSTIN: ${bill.restaurantInfo.gstNumber}`);
            }

            printer
              .text('Thank you for your order!')
              .text('--- TAX INVOICE ---')
              .text('--------------------------------')
              .align('lt')
              .text(`Bill #: ${bill.id ? bill.id.slice(-8).toUpperCase() : 'N/A'}`)
              .text(`Customer: ${bill.customerName || 'Guest'}`)
              .text(`Phone: ${bill.customerPhone || 'N/A'}`)
              .text('================================')
              .style('bu')
              .text('ITEMS:')
              .style('normal');

            const allItems = bill.orders 
              ? bill.orders.flatMap(order => order.items || [])
              : (bill.items || []);

            allItems.forEach(item => {
              printer
                .text(`${item.name}`)
                .text(`  ${item.quantity} x Rs.${item.price}  Rs.${(item.price * item.quantity).toFixed(2)}`);
            });

            printer.text('================================');
            printer.text(`Subtotal:          Rs.${(bill.subtotal || 0).toFixed(2)}`);

            if (bill.gst && bill.gst.enabled) {
              printer.text(`GST (${bill.gst.totalRate}%):        Rs.${(bill.gst.total || 0).toFixed(2)}`);
            }

            printer
              .style('bu')
              .size(2, 1)
              .text(`TOTAL:             Rs.${(bill.totalAmount || 0).toFixed(2)}`)
              .size(1, 1)
              .style('normal')
              .text('================================')
              .align('ct')
              .text('Thank You! Visit Again!')
              .feed(3)
              .cut()
              .close();

            console.log('✅ ESC/POS bill printed successfully');
            resolve({ success: true, message: 'Printed successfully' });

          } catch (printError) {
            console.error('ESC/POS print error:', printError);
            reject(printError);
          }
        });

      } catch (error) {
        console.error('ESC/POS setup error:', error);
        reject(error);
      }
    });
  }
}

// Export singleton instance
module.exports = new PrinterService();
