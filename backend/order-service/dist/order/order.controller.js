"use strict";

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec0, _dec1, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _dec69, _dec70, _dec71, _class, _class2;
function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
const {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Query,
  HttpException,
  HttpStatus,
  Inject,
  Headers
} = require('@nestjs/common');
const {
  MessagePattern,
  Payload
} = require('@nestjs/microservices');
const {
  OrderService
} = require('./order.service');
let OrderController = (_dec = Controller('api/orders'), _dec2 = function (target, key) {
  return Inject(OrderService)(target, undefined, 0);
}, _dec3 = Reflect.metadata("design:type", Function), _dec4 = Reflect.metadata("design:paramtypes", [void 0]), _dec5 = Post(), _dec6 = function (target, key) {
  return Body()(target, key, 0);
}, _dec7 = Reflect.metadata("design:type", Function), _dec8 = Reflect.metadata("design:paramtypes", [void 0]), _dec9 = Get('customer/:customerId'), _dec0 = function (target, key) {
  return Param('customerId')(target, key, 0);
}, _dec1 = Reflect.metadata("design:type", Function), _dec10 = Reflect.metadata("design:paramtypes", [void 0]), _dec11 = Get('restaurant/stats'), _dec12 = function (target, key) {
  return Headers('authorization')(target, key, 0);
}, _dec13 = Reflect.metadata("design:type", Function), _dec14 = Reflect.metadata("design:paramtypes", [void 0]), _dec15 = Get('restaurant/:restaurantId'), _dec16 = function (target, key) {
  return Param('restaurantId')(target, key, 0);
}, _dec17 = Reflect.metadata("design:type", Function), _dec18 = Reflect.metadata("design:paramtypes", [void 0]), _dec19 = Get('restaurant'), _dec20 = function (target, key) {
  return Headers('authorization')(target, key, 0);
}, _dec21 = Reflect.metadata("design:type", Function), _dec22 = Reflect.metadata("design:paramtypes", [void 0]), _dec23 = Get('stats/restaurant/:restaurantId'), _dec24 = function (target, key) {
  return Param('restaurantId')(target, key, 0);
}, _dec25 = function (target, key) {
  return Query('startDate')(target, key, 1);
}, _dec26 = function (target, key) {
  return Query('endDate')(target, key, 2);
}, _dec27 = Reflect.metadata("design:type", Function), _dec28 = Reflect.metadata("design:paramtypes", [void 0, void 0, void 0]), _dec29 = Get(':id'), _dec30 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec31 = Reflect.metadata("design:type", Function), _dec32 = Reflect.metadata("design:paramtypes", [void 0]), _dec33 = Patch(':id/preparing'), _dec34 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec35 = Reflect.metadata("design:type", Function), _dec36 = Reflect.metadata("design:paramtypes", [void 0]), _dec37 = Patch(':id/ready'), _dec38 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec39 = Reflect.metadata("design:type", Function), _dec40 = Reflect.metadata("design:paramtypes", [void 0]), _dec41 = Patch(':id/delivering'), _dec42 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec43 = function (target, key) {
  return Body()(target, key, 1);
}, _dec44 = Reflect.metadata("design:type", Function), _dec45 = Reflect.metadata("design:paramtypes", [void 0, void 0]), _dec46 = Patch(':id/complete'), _dec47 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec48 = Reflect.metadata("design:type", Function), _dec49 = Reflect.metadata("design:paramtypes", [void 0]), _dec50 = Patch(':id/cancel'), _dec51 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec52 = function (target, key) {
  return Body()(target, key, 1);
}, _dec53 = Reflect.metadata("design:type", Function), _dec54 = Reflect.metadata("design:paramtypes", [void 0, void 0]), _dec55 = Patch(':id/restaurant-confirm'), _dec56 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec57 = Reflect.metadata("design:type", Function), _dec58 = Reflect.metadata("design:paramtypes", [void 0]), _dec59 = Patch(':id/restaurant-reject'), _dec60 = function (target, key) {
  return Param('id')(target, key, 0);
}, _dec61 = function (target, key) {
  return Body()(target, key, 1);
}, _dec62 = Reflect.metadata("design:type", Function), _dec63 = Reflect.metadata("design:paramtypes", [void 0, void 0]), _dec64 = MessagePattern('payment_confirmed'), _dec65 = function (target, key) {
  return Payload()(target, key, 0);
}, _dec66 = Reflect.metadata("design:type", Function), _dec67 = Reflect.metadata("design:paramtypes", [void 0]), _dec68 = MessagePattern('delivery_status_changed'), _dec69 = function (target, key) {
  return Payload()(target, key, 0);
}, _dec70 = Reflect.metadata("design:type", Function), _dec71 = Reflect.metadata("design:paramtypes", [void 0]), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = (_class2 = class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }
  async createOrder(createDto) {
    try {
      if (!createDto.customerId || !createDto.restaurantId || !createDto.items || createDto.items.length === 0) {
        throw new HttpException('Missing required fields: customerId, restaurantId, items', HttpStatus.BAD_REQUEST);
      }

      // Validate items structure
      createDto.items.forEach((item, idx) => {
        if (!item.menuItemId || !item.name || item.price === undefined || !item.quantity) {
          throw new HttpException(`Invalid item at index ${idx}: missing menuItemId, name, price, or quantity`, HttpStatus.BAD_REQUEST);
        }
      });
      return await this.orderService.createOrder(createDto);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to create order', HttpStatus.BAD_REQUEST);
    }
  }
  async getCustomerOrders(customerId) {
    return this.orderService.getOrdersByCustomer(customerId);
  }
  async getRestaurantStatsFromToken(auth) {
    try {
      const token = auth?.replace('Bearer ', '');
      if (!token) throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
      const decoded = await this.orderService.verifyToken(token);
      if (!decoded.restaurantId) throw new HttpException('No restaurant associated', HttpStatus.BAD_REQUEST);
      return this.orderService.getRestaurantStats(decoded.restaurantId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getRestaurantOrders(restaurantId) {
    return this.orderService.getOrdersByRestaurant(restaurantId);
  }
  async getRestaurantOrdersFromToken(auth) {
    try {
      const token = auth?.replace('Bearer ', '');
      if (!token) throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
      const decoded = await this.orderService.verifyToken(token);
      if (!decoded.restaurantId) throw new HttpException('No restaurant associated', HttpStatus.BAD_REQUEST);
      return this.orderService.getOrdersByRestaurant(decoded.restaurantId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getRestaurantStats(restaurantId, startDate, endDate) {
    return this.orderService.getOrderStats(restaurantId, new Date(startDate), new Date(endDate));
  }
  async getOrder(id) {
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }
  async startPreparing(id) {
    return this.orderService.startPreparing(id);
  }
  async markReady(id) {
    return this.orderService.startReady(id);
  }
  async startDelivery(id, body) {
    const {
      distanceKm,
      etaMinutes
    } = body;
    if (distanceKm === undefined || etaMinutes === undefined) {
      throw new HttpException('Missing distance or ETA', HttpStatus.BAD_REQUEST);
    }
    return this.orderService.startDelivery(id, distanceKm, etaMinutes);
  }
  async completeOrder(id) {
    return this.orderService.completeOrder(id);
  }
  async cancelOrder(id, body) {
    const {
      reason
    } = body;
    try {
      return await this.orderService.cancelOrder(id, reason || 'No reason provided');
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async restaurantConfirmOrder(id) {
    try {
      return await this.orderService.restaurantConfirmOrder(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async restaurantRejectOrder(id, body) {
    const {
      reason
    } = body;
    try {
      return await this.orderService.restaurantRejectOrder(id, reason || 'No reason provided');
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  async handlePaymentConfirmed(data) {
    return this.orderService.markOrderAsPaid(data.orderId, data.paymentId);
  }
  async handleDeliveryStatusChange(data) {
    return this.orderService.handleDeliveryStatusChange(data);
  }
}, _applyDecoratedDescriptor(_class2.prototype, "createOrder", [_dec5, _dec6, _dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "createOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getCustomerOrders", [_dec9, _dec0, _dec1, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "getCustomerOrders"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRestaurantStatsFromToken", [_dec11, _dec12, _dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "getRestaurantStatsFromToken"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRestaurantOrders", [_dec15, _dec16, _dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "getRestaurantOrders"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRestaurantOrdersFromToken", [_dec19, _dec20, _dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "getRestaurantOrdersFromToken"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRestaurantStats", [_dec23, _dec24, _dec25, _dec26, _dec27, _dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "getRestaurantStats"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getOrder", [_dec29, _dec30, _dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "getOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "startPreparing", [_dec33, _dec34, _dec35, _dec36], Object.getOwnPropertyDescriptor(_class2.prototype, "startPreparing"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "markReady", [_dec37, _dec38, _dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "markReady"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "startDelivery", [_dec41, _dec42, _dec43, _dec44, _dec45], Object.getOwnPropertyDescriptor(_class2.prototype, "startDelivery"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "completeOrder", [_dec46, _dec47, _dec48, _dec49], Object.getOwnPropertyDescriptor(_class2.prototype, "completeOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "cancelOrder", [_dec50, _dec51, _dec52, _dec53, _dec54], Object.getOwnPropertyDescriptor(_class2.prototype, "cancelOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "restaurantConfirmOrder", [_dec55, _dec56, _dec57, _dec58], Object.getOwnPropertyDescriptor(_class2.prototype, "restaurantConfirmOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "restaurantRejectOrder", [_dec59, _dec60, _dec61, _dec62, _dec63], Object.getOwnPropertyDescriptor(_class2.prototype, "restaurantRejectOrder"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handlePaymentConfirmed", [_dec64, _dec65, _dec66, _dec67], Object.getOwnPropertyDescriptor(_class2.prototype, "handlePaymentConfirmed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleDeliveryStatusChange", [_dec68, _dec69, _dec70, _dec71], Object.getOwnPropertyDescriptor(_class2.prototype, "handleDeliveryStatusChange"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class);
module.exports = {
  OrderController
};