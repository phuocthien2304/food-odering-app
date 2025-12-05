const { Injectable } = require('@nestjs/common');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { InjectModel } = require('@nestjs/mongoose');

@Injectable()
class OrderService {
  constructor(@InjectModel('Order') orderModel) {
    this.OrderModel = orderModel;

    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.ORDER_QUEUE || 'order_queue',
        queueOptions: { durable: false },
      },
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

    // Validate delivery address if online payment
    if (createDto.paymentMethod === 'ONLINE' || createDto.paymentMethod === 'STRIPE') {
      const { deliveryAddress } = createDto;
      if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.ward || 
          !deliveryAddress.district || !deliveryAddress.city) {
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
      paymentMethod: createDto.paymentMethod || 'COD',
      deliveryAddress: createDto.deliveryAddress,
      customerLocation: createDto.customerLocation,
      notes: createDto.notes || '',
      status: ['ONLINE', 'STRIPE'].includes(createDto.paymentMethod) ? 'PENDING_PAYMENT' : 'CREATED'
    });

    const saved = await order.save();

    // Emit events based on payment method
    if (['ONLINE', 'STRIPE'].includes(createDto.paymentMethod)) {
      this.client.emit('order_requires_payment', {
        ...saved.toObject(),
        paymentMethod: createDto.paymentMethod
      });
    } else {
      this.client.emit('order_created', saved);
    }

    return saved;
  }

  async getOrderById(id) {
    return this.OrderModel.findById(id).exec();
  }

  async getOrdersByCustomer(customerId) {
    return this.OrderModel.find({ customerId }).sort({ createdAt: -1 }).exec();
  }

  async getOrdersByRestaurant(restaurantId, status = null) {
    const query = { restaurantId };
    if (status) query.status = status;
    return this.OrderModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async confirmOrder(orderId) {
    return this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async startPreparing(orderId) {
    return this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'PREPARING',
        preparingAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async startDelivery(orderId, distanceKm, etaMinutes) {
    return this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'DELIVERING',
        deliveringAt: new Date(),
        distanceKm,
        etaMinutes,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async completeOrder(orderId) {
    return this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async cancelOrder(orderId, reason) {
    const order = await this.OrderModel.findById(orderId).exec();
    
    if (!['CREATED', 'CONFIRMED'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    return this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        notes: `${order.notes || ''}\nCancellation reason: ${reason}`,
        updatedAt: new Date()
      },
      { new: true }
    ).exec();
  }

  async markOrderAsPaid(orderId, paymentId) {
    const order = await this.OrderModel.findByIdAndUpdate(
      orderId,
      {
        status: 'CONFIRMED',
        paymentId,
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).exec();

    // Emit event to notify restaurant
    this.client.emit('order_paid_confirmed', order);
    return order;
  }

  async handleDeliveryStatusChange(deliveryData) {
    if (deliveryData.status === 'DELIVERING') {
      return this.startDelivery(deliveryData.orderId, deliveryData.distanceKm, deliveryData.etaMinutes);
    } else if (deliveryData.status === 'COMPLETED') {
      return this.completeOrder(deliveryData.orderId);
    }
  }

  async getOrderStats(restaurantId, startDate, endDate) {
    const orders = await this.OrderModel.find({
      restaurantId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).exec();

    return {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'COMPLETED').length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.status === 'COMPLETED' ? o.total : 0), 0),
      codRevenue: orders.filter(o => o.paymentMethod === 'COD' && o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0),
      onlineRevenue: orders.filter(o => o.paymentMethod === 'ONLINE' && o.status === 'COMPLETED').reduce((sum, o) => sum + o.total, 0)
    };
  }
}

module.exports = { OrderService };
