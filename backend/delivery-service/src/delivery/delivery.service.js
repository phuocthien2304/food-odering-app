const { Injectable } = require('@nestjs/common');
const { InjectModel } = require('@nestjs/mongoose');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');

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
    const delivery = new this.DeliveryModel({
      orderId: orderData._id,
      restaurantId: orderData.restaurantId,
      customerId: orderData.customerId,
      restaurantLocation: orderData.restaurantLocation,
      customerLocation: orderData.customerLocation,
      status: 'CONFIRMED'
    });
    return delivery.save();
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
    this.client.emit('delivery_status_changed', {
      deliveryId: updated._id,
      orderId: updated.orderId,
      status: updated.status
    });

    return updated;
  }

  async getDeliveriesByRestaurant(restaurantId, status = null) {
    const query = { restaurantId };
    if (status) query.status = status;
    return this.DeliveryModel.find(query).sort({ createdAt: -1 }).exec();
  }
}

module.exports = { DeliveryService };
