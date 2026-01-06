const { Injectable } = require('@nestjs/common');
const { InjectModel } = require('@nestjs/mongoose');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const axios = require('axios');

@Injectable()
class DeliveryService {
  constructor(@InjectModel('Delivery') deliveryModel) {
    this.DeliveryModel = deliveryModel;
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.DELIVERY_QUEUE || 'delivery_queue',
        queueOptions: { durable: false },
      },
    });

    this.orderClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.ORDER_QUEUE || 'order_queue',
        queueOptions: { durable: false },
      },
    });

    this.orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
  }

  async getOrderById(orderId) {
    const res = await axios.get(`${this.orderServiceUrl}/api/orders/${orderId}`);
    return res && res.data;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateETA(distanceKm, speedMinutesPerKm = 5) {
    return Math.ceil(distanceKm * speedMinutesPerKm);
  }

  async createDelivery(orderData) {
    // Avoid creating duplicate delivery for same order
    const existing = await this.getDeliveryByOrderId(orderData._id);
    const desiredStatus = orderData && orderData.status === 'CONFIRMED' ? 'CONFIRMED' : 'CREATED';
    if (existing) {
      if (desiredStatus === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
        return this.DeliveryModel.findByIdAndUpdate(
          existing._id,
          { status: 'CONFIRMED', updatedAt: new Date() },
          { new: true }
        ).exec();
      }
      return existing;
    }

    const delivery = new this.DeliveryModel({
      orderId: orderData._id,
      restaurantId: orderData.restaurantId,
      customerId: orderData.customerId,
      restaurantLocation: orderData.restaurantLocation,
      customerLocation: orderData.customerLocation,
      status: desiredStatus
    });

    const saved = await delivery.save();
    return saved;
  }

  async getAvailableDeliveries() {
    const deliveries = await this.DeliveryModel.find({ status: 'CONFIRMED', driverId: { $exists: false } }).sort({ createdAt: -1 }).exec();
    if (!deliveries || deliveries.length === 0) return deliveries;

    const checks = await Promise.all(
      deliveries.map(async (d) => {
        try {
          const order = await this.getOrderById(d.orderId);
          if (order && order.status === 'CONFIRMED') return d;
        } catch (_) {
          // ignore
        }
        try {
          await this.DeliveryModel.findByIdAndUpdate(
            d._id,
            { status: 'CREATED', updatedAt: new Date() },
            { new: false }
          ).exec();
        } catch (_) {
          // ignore
        }
        return null;
      })
    );

    return checks.filter(Boolean);
  }

  async getDeliveriesByDriver(driverId) {
    return this.DeliveryModel.find({ driverId }).sort({ createdAt: -1 }).exec();
  }

  async assignDriver(id, driverId) {
    // Check if driver already has an active delivery
    const activeDelivery = await this.DeliveryModel.findOne({
      driverId,
      status: { $in: ['ASSIGNED', 'AT_RESTAURANT', 'PICKED_UP', 'DELIVERING'] }
    }).exec();

    if (activeDelivery) {
      throw new Error('Bạn đã có đơn hàng đang thực hiện. Vui lòng hoàn thành đơn hàng hiện tại trước khi nhận đơn mới.');
    }

    const delivery = await this.DeliveryModel.findById(id).exec();
    if (!delivery) {
      throw new Error('Đơn hàng không tồn tại');
    }

    try {
      const order = await this.getOrderById(delivery.orderId);
      if (!order || order.status !== 'CONFIRMED') {
        try {
          if (delivery.status === 'CONFIRMED') {
            await this.DeliveryModel.findByIdAndUpdate(
              delivery._id,
              { status: 'CREATED', updatedAt: new Date() },
              { new: false }
            ).exec();
          }
        } catch (_) {
          // ignore
        }
        throw new Error('Đơn hàng chưa được nhà hàng xác nhận');
      }
    } catch (e) {
      if (e && e.message) throw e;
      throw new Error('Đơn hàng chưa được nhà hàng xác nhận');
    }

    // Atomic assign: only assign if no driverId yet (prevent race)
    const updated = await this.DeliveryModel.findOneAndUpdate(
      { _id: id, driverId: { $exists: false }, status: 'CONFIRMED' },
      { $set: { driverId, status: 'ASSIGNED', assignedAt: new Date(), updatedAt: new Date() } },
      { new: true }
    ).exec();

    if (!updated) {
      const current = await this.DeliveryModel.findById(id).exec();
      if (!current) {
        throw new Error('Đơn hàng không tồn tại');
      }
      if (current.driverId) {
        throw new Error('Đơn hàng đã được nhận bởi tài xế khác hoặc không tìm thấy');
      }
      if (current.status !== 'CONFIRMED') {
        throw new Error('Đơn hàng chưa được nhà hàng xác nhận');
      }
      throw new Error('Không thể nhận đơn hàng');
    }

    // Emit assignment event
    try { 
      this.orderClient.emit('delivery_status_changed', { 
        deliveryId: updated._id, 
        orderId: updated.orderId, 
        driverId, 
        status: updated.status 
      }); 
    } catch (_) {}
    
    return updated;
  }

  async markArrived(id) {
    const updated = await this.DeliveryModel.findByIdAndUpdate(
      id,
      { status: 'AT_RESTAURANT', arrivedAt: new Date(), updatedAt: new Date() },
      { new: true }
    ).exec();
    this.orderClient.emit('delivery_status_changed', { deliveryId: updated._id, orderId: updated.orderId, status: updated.status });
    // Best-effort HTTP update to Order service
    try {
      await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/preparing`);
    } catch (e) {}
    return updated;
  }

  async markPicked(id) {
    const updated = await this.DeliveryModel.findByIdAndUpdate(
      id,
      { status: 'PICKED_UP', pickedAt: new Date(), startedAt: new Date(), updatedAt: new Date() },
      { new: true }
    ).exec();
    this.orderClient.emit('delivery_status_changed', { deliveryId: updated._id, orderId: updated.orderId, status: 'PICKED_UP' });
    // Best-effort HTTP update to Order service: mark as READY for customer view
    try {
      await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/ready`);
    } catch (e) {}
    return updated;
  }

  async completeDelivery(id) {
    const updated = await this.DeliveryModel.findByIdAndUpdate(
      id,
      { status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() },
      { new: true }
    ).exec();
    this.orderClient.emit('delivery_status_changed', { deliveryId: updated._id, orderId: updated.orderId, status: 'COMPLETED' });
    try {
      await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/complete`);
    } catch (e) {}
    return updated;
  }

  async getDeliveryById(id) {
    return this.DeliveryModel.findById(id).exec();
  }

  async getDeliveryByOrderId(orderId) {
    return this.DeliveryModel.findOne({ orderId }).exec();
  }

  async startDelivery(id, restaurantLat, restaurantLng, customerLat, customerLng) {
    const distanceKm = this.calculateDistance(restaurantLat, restaurantLng, customerLat, customerLng);
    const etaMinutes = this.calculateETA(distanceKm);
    
    const updated = await this.DeliveryModel.findByIdAndUpdate(
      id,
      {
        status: 'DELIVERING',
        distanceKm,
        etaMinutes,
        startedAt: new Date()
      },
      { new: true }
    ).exec();

    // Emit event to notify order service
    this.client.emit('delivery_started', {
      deliveryId: updated._id,
      orderId: updated.orderId,
      distanceKm,
      etaMinutes
    });

    return updated;
  }

  async updateStatus(id, status) {
    const data = { status, updatedAt: new Date() };
    if (status === 'COMPLETED') {
      data.completedAt = new Date();
    }
    
    const updated = await this.DeliveryModel.findByIdAndUpdate(id, data, { new: true }).exec();
    
    // Emit status change event
    this.orderClient.emit('delivery_status_changed', {
      deliveryId: updated._id,
      orderId: updated.orderId,
      status: updated.status
    });

    // Also best-effort HTTP update to keep order status in sync
    try {
      const s = updated.status;
      if (s === 'AT_RESTAURANT') {
        await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/preparing`);
      } else if (s === 'PICKED_UP') {
        await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/ready`);
      } else if (s === 'DELIVERING') {
        await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/delivering`, { distanceKm: updated.distanceKm || 0, etaMinutes: updated.etaMinutes || 0 });
      } else if (s === 'COMPLETED') {
        await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/complete`);
      } else if (s === 'CANCELLED') {
        await axios.patch(`${this.orderServiceUrl}/api/orders/${updated.orderId}/cancel`, { reason: 'Delivery cancelled' });
      }
    } catch (e) {
      // ignore
    }

    return updated;
  }

  async getDeliveriesByRestaurant(restaurantId, status = null) {
    const query = { restaurantId };
    if (status) query.status = status;
    return this.DeliveryModel.find(query).sort({ createdAt: -1 }).exec();
  }
}

module.exports = { DeliveryService };
