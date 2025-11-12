const { Server } = require('socket.io');

// Store connected clients
const clients = new Map();

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000', 
        'http://localhost:3001',
        'http://10.33.10.29:3000',
        'http://10.33.10.29:3001'
      ],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`\n✅ Client connected: ${socket.id}`);

    // Owner joins their restaurant room
    socket.on('owner:join', (ownerId) => {
      socket.join(`owner:${ownerId}`);
      clients.set(socket.id, { type: 'owner', ownerId });
      console.log(`👨‍💼 Owner ${ownerId} joined their room`);
    });

    // Customer joins order room
    socket.on('customer:join', ({ orderId, phone }) => {
      socket.join(`order:${orderId}`);
      socket.join(`customer:${phone}`);
      clients.set(socket.id, { type: 'customer', orderId, phone });
      console.log(`👤 Customer joined order room: ${orderId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const client = clients.get(socket.id);
      if (client) {
        console.log(`❌ ${client.type} disconnected: ${socket.id}`);
        clients.delete(socket.id);
      }
    });

    // Ping-pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
};

// Notification helper functions
const notifyNewOrder = (ownerId, orderData) => {
  if (!io) return;
  
  console.log(`📢 Sending new order notification to owner: ${ownerId}`);
  io.to(`owner:${ownerId}`).emit('notification', {
    type: 'new_order',
    title: 'New Order Received! 🎉',
    message: `New order #${orderData.orderNumber} from ${orderData.customerName}`,
    data: orderData,
    timestamp: new Date()
  });
};

const notifyOrderReady = (orderId, customerPhone, orderData) => {
  if (!io) return;
  
  console.log(`📢 Sending order ready notification to customer: ${customerPhone}`);
  
  // Send to specific order room and customer's phone room
  io.to(`order:${orderId}`).emit('notification', {
    type: 'order_ready',
    title: '🎉 Your Order is Ready!',
    message: `Great news! Your order #${orderData.orderNumber} is ready for pickup. Thank you for your patience! 😊`,
    data: orderData,
    timestamp: new Date()
  });

  io.to(`customer:${customerPhone}`).emit('notification', {
    type: 'order_ready',
    title: '🎉 Your Order is Ready!',
    message: `Great news! Your order #${orderData.orderNumber} is ready for pickup. Thank you for your patience! 😊`,
    data: orderData,
    timestamp: new Date()
  });
};

const notifyOrderStatusChange = (orderId, customerPhone, status, orderData) => {
  if (!io) return;
  
  const statusMessages = {
    preparing: `Your order #${orderData.orderNumber} is being prepared! 👨‍🍳`,
    ready: `Your order #${orderData.orderNumber} is ready for pickup! 🎉`,
    completed: `Your order #${orderData.orderNumber} has been completed. Thank you! 💚`,
    cancelled: `Your order #${orderData.orderNumber} has been cancelled. 😔`
  };

  const message = statusMessages[status] || `Order status updated to ${status}`;

  io.to(`order:${orderId}`).emit('notification', {
    type: 'order_status',
    title: 'Order Update',
    message,
    data: { ...orderData, status },
    timestamp: new Date()
  });

  io.to(`customer:${customerPhone}`).emit('notification', {
    type: 'order_status',
    title: 'Order Update',
    message,
    data: { ...orderData, status },
    timestamp: new Date()
  });
};

module.exports = {
  initializeSocket,
  notifyNewOrder,
  notifyOrderReady,
  notifyOrderStatusChange,
  getIO: () => io
};
