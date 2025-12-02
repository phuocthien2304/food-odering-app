const { Injectable } = require('@nestjs/common');
const axios = require('axios');

@Injectable()
class GatewayService {
  constructor() {
    this.services = {
      user: process.env.USER_SERVICE_URL || 'http://user-service:3003',
      order: process.env.ORDER_SERVICE_URL || 'http://order-service:3001',
      restaurant: process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3002',
      delivery: process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005'
    };
  }

  async proxyRequest(service, method, path, data = null, headers = {}) {
    try {
      const url = `${this.services[service]}${path}`;
      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw {
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message
      };
    }
  }

  async register(registerDto) {
    return this.proxyRequest('user', 'POST', '/api/auth/register', registerDto);
  }

  async login(loginDto) {
    return this.proxyRequest('user', 'POST', '/api/auth/login', loginDto);
  }

  async verifyEmail(data) {
    return this.proxyRequest('user', 'POST', '/api/auth/verify-email', data);
  }

  async verifyToken(token) {
    return this.proxyRequest('user', 'POST', '/api/auth/verify-token', null, { Authorization: `Bearer ${token}` });
  }

  // --- HÀM MỚI CHO PROFILE ---
  async getProfileByToken(token) {
    return this.proxyRequest('user', 'GET', '/api/auth/profile', null, { Authorization: `Bearer ${token}` });
  }

  async getProfile(userId) {
    return this.proxyRequest('user', 'GET', `/api/auth/profile/${userId}`);
  }

  async updateProfile(userId, updateDto) {
    return this.proxyRequest('user', 'PATCH', `/api/auth/profile/${userId}`, updateDto);
  }

  async getRestaurants() {
    return this.proxyRequest('restaurant', 'GET', '/api/restaurants');
  }

  async getRestaurantById(id) {
    return this.proxyRequest('restaurant', 'GET', `/api/restaurants/${id}`);
  }

  async searchRestaurants(keyword) {
    return this.proxyRequest('restaurant', 'GET', `/api/restaurants/search/keyword?q=${keyword}`);
  }

  async getRestaurantMenu(restaurantId) {
    return this.proxyRequest('restaurant', 'GET', `/api/restaurants/${restaurantId}/menu`);
  }

  async createOrder(orderDto) {
    return this.proxyRequest('order', 'POST', '/api/orders', orderDto);
  }

  async getOrder(orderId) {
    return this.proxyRequest('order', 'GET', `/api/orders/${orderId}`);
  }

  async getCustomerOrders(customerId) {
    return this.proxyRequest('order', 'GET', `/api/orders/customer/${customerId}`);
  }

  async confirmOrder(orderId) {
    return this.proxyRequest('order', 'PATCH', `/api/orders/${orderId}/confirm`, {});
  }

  async cancelOrder(orderId, reason) {
    return this.proxyRequest('order', 'PATCH', `/api/orders/${orderId}/cancel`, { reason });
  }

  async initiatePayment(paymentDto) {
    return this.proxyRequest('payment', 'POST', '/api/payments/initiate', paymentDto);
  }

  async getPayment(paymentId) {
    return this.proxyRequest('payment', 'GET', `/api/payments/${paymentId}`);
  }

  async getDelivery(deliveryId) {
    return this.proxyRequest('delivery', 'GET', `/api/deliveries/${deliveryId}`);
  }

  async getDeliveryByOrder(orderId) {
    return this.proxyRequest('delivery', 'GET', `/api/deliveries/order/${orderId}`);
  }

  async startDelivery(deliveryId, data) {
    return this.proxyRequest('delivery', 'POST', `/api/deliveries/${deliveryId}/start`, data);
  }
}

module.exports = { GatewayService };