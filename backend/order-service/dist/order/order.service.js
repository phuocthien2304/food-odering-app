"use strict";

var _dec, _dec2, _dec3, _dec4, _class;
const {
  Injectable
} = require('@nestjs/common');
const {
  ClientProxyFactory,
  Transport
} = require('@nestjs/microservices');
const {
  InjectModel
} = require('@nestjs/mongoose');
const axios = require('axios');
let OrderService = (_dec = Injectable(), _dec2 = function (target, key) {
  return InjectModel('Order')(target, undefined, 0);
}, _dec3 = Reflect.metadata("design:type", Function), _dec4 = Reflect.metadata("design:paramtypes", [void 0]), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = class OrderService {
  constructor(orderModel) {
    this.OrderModel = orderModel;

    // Track scheduled timers for automatic status progression
    this.scheduledProgress = new Map();
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.ORDER_QUEUE || 'order_queue',
        queueOptions: {
          durable: false
        }
      }
    });
    this.deliveryClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.DELIVERY_QUEUE || 'delivery_queue',
        queueOptions: {
          durable: false
        }
      }
    });
    this.paymentClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.PAYMENT_QUEUE || 'payment_queue',
        queueOptions: {
          durable: false
        }
      }
    });
  }
  async createOrder(createDto) {
    // Validate cart items
    if (!createDto.items || createDto.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate subtotal from cart items
    const subtotal = createDto.items.reduce((sum, item) => {
      const qty = item.quantity || 1;
      const price = item.price || 0;
      if (price < 0 || qty < 0) {
        throw new Error('Invalid price or quantity');
      }
      return sum + price * qty;
    }, 0);
    const normalizedPaymentMethod = createDto.paymentMethod === 'ONLINE' ? 'SEPAY' : createDto.paymentMethod || 'COD';
    const rawDeliveryAddress = createDto.deliveryAddress || {};
    const normalizedDeliveryAddress = {
      ...rawDeliveryAddress,
      city: rawDeliveryAddress.city || rawDeliveryAddress.province
    };

    // Validate delivery address if online payment
    if (normalizedPaymentMethod === 'SEPAY') {
      if (!normalizedDeliveryAddress || !normalizedDeliveryAddress.street || !normalizedDeliveryAddress.ward || !normalizedDeliveryAddress.city) {
        throw new Error('Complete delivery address is required for online payment');
      }
    }
    const deliveryFee = createDto.deliveryFee || 15000; // Default delivery fee VND
    const total = subtotal + deliveryFee;

    // Group items by restaurant (validate single restaurant per order)
    const order = new this.OrderModel({
      customerId: createDto.customerId,
      restaurantId: createDto.restaurantId,
      items: createDto.items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        notes: item.notes || ''
      })),
      subtotal,
      deliveryFee,
      total,
      paymentMethod: normalizedPaymentMethod,
      deliveryAddress: normalizedDeliveryAddress,
      recipientName: createDto.recipientName || '',
      recipientPhone: createDto.recipientPhone || '',
      customerLocation: createDto.customerLocation,
      notes: createDto.notes || '',
      status: normalizedPaymentMethod === 'SEPAY' ? 'PENDING_PAYMENT' : 'PENDING_RESTAURANT_CONFIRMATION'
    });
    const saved = await order.save();

    // Emit events based on payment method
    if (normalizedPaymentMethod === 'SEPAY') {
      const orderData = {
        _id: saved._id,
        customerId: saved.customerId,
        restaurantId: saved.restaurantId,
        total: saved.total,
        subtotal: saved.subtotal,
        deliveryFee: saved.deliveryFee,
        paymentMethod: normalizedPaymentMethod
      };
      console.log(`[ORDER] Emitting order_requires_payment - Order: ${saved._id}, Total: ${saved.total}, Subtotal: ${saved.subtotal}`);
      this.paymentClient.emit('order_requires_payment', orderData);
    } else {
      this.deliveryClient.emit('order_created', saved);
    }

    // Previously this service scheduled automatic progression for CREATED orders.
    // To keep order status in sync with driver actions, scheduling is disabled
    // and order status will be updated by delivery events instead.

    return saved;
  }
  async getOrderById(id) {
    return this.OrderModel.findById(id).exec();
  }

  // Schedule automatic progression for an order through statuses every minute
  scheduleOrderProgress(orderId) {
    // Clear existing timers if any
    this.clearScheduledProgress(orderId);
    const sequence = ['CREATED', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
    const run = async () => {
      const order = await this.OrderModel.findById(orderId).exec();
      if (!order) return;
      if (['COMPLETED', 'CANCELLED'].includes(order.status)) return;
      const currentIndex = sequence.indexOf(order.status);
      if (currentIndex === -1) return; // status not in sequence (e.g., PENDING_PAYMENT)

      const timeouts = [];
      for (let i = currentIndex + 1; i < sequence.length; i++) {
        const delay = (i - currentIndex) * 60 * 1000; // minutes -> ms
        const statusToSet = sequence[i];
        const t = setTimeout(async () => {
          // Double-check order not already terminal
          const latest = await this.OrderModel.findById(orderId).exec();
          if (!latest) return;
          if (['COMPLETED', 'CANCELLED'].includes(latest.status)) return;
          const update = {
            status: statusToSet,
            updatedAt: new Date()
          };
          if (statusToSet === 'CONFIRMED') update.confirmedAt = new Date();
          if (statusToSet === 'PREPARING') update.preparingAt = new Date();
          if (statusToSet === 'READY') update.readyAt = new Date();
          if (statusToSet === 'COMPLETED') update.completedAt = new Date();
          const updated = await this.OrderModel.findByIdAndUpdate(orderId, update, {
            new: true
          }).exec();
          // Emit an event for subscribers
          try {
            this.client.emit('order_status_changed', {
              orderId,
              status: statusToSet
            });
          } catch (_) {}
          // If completed, clear timers
          if (statusToSet === 'COMPLETED') {
            this.clearScheduledProgress(orderId);
          }
        }, delay);
        timeouts.push(t);
      }
      this.scheduledProgress.set(String(orderId), timeouts);
    };

    // Start the progression runner immediately (it will schedule all future steps)
    run().catch(() => {});
  }
  clearScheduledProgress(orderId) {
    const key = String(orderId);
    const arr = this.scheduledProgress.get(key);
    if (arr && Array.isArray(arr)) {
      arr.forEach(t => clearTimeout(t));
    }
    this.scheduledProgress.delete(key);
  }
  async getOrdersByCustomer(customerId) {
    return this.OrderModel.find({
      customerId
    }).sort({
      createdAt: -1
    }).exec();
  }
  async getOrdersByRestaurant(restaurantId, status = null) {
    const query = {
      restaurantId
    };
    if (status) query.status = status;
    return this.OrderModel.find(query).sort({
      createdAt: -1
    }).exec();
  }
  async confirmOrder(orderId) {
    const updated = await this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
    // Do not auto-schedule progression; order status changes will follow driver events.
    return updated;
  }
  async startPreparing(orderId) {
    return this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'PREPARING',
      preparingAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
  }
  async startDelivery(orderId, distanceKm, etaMinutes) {
    return this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'DELIVERING',
      deliveringAt: new Date(),
      distanceKm,
      etaMinutes,
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
  }
  async startReady(orderId, distanceKm, etaMinutes) {
    return this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'READY',
      readyAt: new Date(),
      distanceKm,
      etaMinutes,
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
  }
  async completeOrder(orderId) {
    // Clear any scheduled progression
    this.clearScheduledProgress(orderId);
    return this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
  }
  async cancelOrder(orderId, reason) {
    const order = await this.OrderModel.findById(orderId).exec();
    if (!['CREATED', 'CONFIRMED', 'PENDING_PAYMENT'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Clear any scheduled progression timers
    this.clearScheduledProgress(orderId);
    return this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      notes: `${order.notes || ''}\nCancellation reason: ${reason}`,
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
  }
  async markOrderAsPaid(orderId, paymentId) {
    const order = await this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'PENDING_RESTAURANT_CONFIRMATION',
      paymentId,
      paidAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();

    // Delivery creation is handled by API Gateway after SePay webhook confirmation.
    return order;
  }
  async handleDeliveryStatusChange(deliveryData) {
    // Map delivery status changes to order status updates so customer sees real-time status
    if (!deliveryData || !deliveryData.orderId) return null;
    const {
      orderId,
      status,
      distanceKm,
      etaMinutes
    } = deliveryData;

    // Cancel any scheduled progression for this order — driver actions take precedence
    try {
      this.clearScheduledProgress(orderId);
    } catch (_) {}
    switch (status) {
      case 'ASSIGNED':
        // Driver accepted the delivery -> mark order as CONFIRMED for customer
        return this.confirmOrder(orderId);
      case 'AT_RESTAURANT':
        // Driver arrived at restaurant -> mark order as PREPARING (or leave as CONFIRMED)
        return this.startPreparing(orderId);
      case 'PICKED_UP':
        return this.startReady(orderId);
      case 'DELIVERING':
        // Driver picked up -> set order to DELIVERING and update ETA if provided
        return this.startDelivery(orderId, distanceKm || 0, etaMinutes || 0);
      case 'COMPLETED':
        return this.completeOrder(orderId);
      case 'CANCELLED':
        // Mark order cancelled if delivery cancelled
        return this.OrderModel.findByIdAndUpdate(orderId, {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          updatedAt: new Date()
        }, {
          new: true
        }).exec();
      default:
        return null;
    }
  }
  async getOrderStats(restaurantId, startDate, endDate) {
    const orders = await this.OrderModel.find({
      restaurantId,
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).exec();
    return {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.total : 0), 0),
      codRevenue: orders.filter(o => o.paymentMethod === 'COD' && o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0),
      onlineRevenue: orders.filter(o => o.paymentMethod === 'ONLINE' && o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0)
    };
  }
  async verifyToken(token) {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3003';
      const response = await axios.get(`${userServiceUrl}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw new Error('Invalid token or user not found');
    }
  }
  async getRestaurantStats(restaurantId) {
    const orders = await this.OrderModel.find({
      restaurantId
    }).exec();
    const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'PENDING_RESTAURANT_CONFIRMATION').length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.total : 0), 0);
    return {
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders
    };
  }
  async restaurantConfirmOrder(orderId) {
    const order = await this.OrderModel.findById(orderId).exec();
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'PENDING_RESTAURANT_CONFIRMATION') {
      throw new Error('Order is not pending restaurant confirmation');
    }
    const updated = await this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();
    return updated;
  }
  async restaurantRejectOrder(orderId, reason) {
    const order = await this.OrderModel.findById(orderId).exec();
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.status !== 'PENDING_RESTAURANT_CONFIRMATION') {
      throw new Error('Order is not pending restaurant confirmation');
    }
    const updated = await this.OrderModel.findByIdAndUpdate(orderId, {
      status: 'REJECTED',
      rejectionReason: reason || 'No reason provided',
      rejectedAt: new Date(),
      updatedAt: new Date()
    }, {
      new: true
    }).exec();

    // Nếu đơn hàng đã thanh toán SEPAY, tự động hoàn tiền
    if (updated.paymentMethod === 'SEPAY' && updated.paymentId) {
      try {
        // Gọi payment service để refund
        const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
        await axios.post(`${paymentServiceUrl}/api/payments/${updated.paymentId}/refund`, {
          reason: `Restaurant rejected order: ${reason}`
        });
        console.log(`Auto-refund initiated for payment ${updated.paymentId}`);
      } catch (error) {
        console.error('Failed to initiate refund:', error.message);
        // Không throw error để không block việc từ chối đơn hàng
        // Admin có thể refund thủ công sau
      }
    }
    return updated;
  }
}) || _class) || _class) || _class) || _class);
module.exports = {
  OrderService
};