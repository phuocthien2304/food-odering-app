const { Controller, Post, Get, Param, Body, Patch, Query, HttpException, HttpStatus, Inject, Headers } = require('@nestjs/common');
const { MessagePattern, Payload } = require('@nestjs/microservices');
const { OrderService } = require('./order.service');

@Controller('api/orders')
class OrderController {
  constructor(@Inject(OrderService) orderService) {
    this.orderService = orderService;
  }

  @Post()
  async createOrder(@Body() createDto) {
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

  @Get('customer/:customerId')
  async getCustomerOrders(@Param('customerId') customerId) {
    return this.orderService.getOrdersByCustomer(customerId);
  }

  @Get('restaurant/stats')
  async getRestaurantStatsFromToken(@Headers('authorization') auth) {
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

  @Get('restaurant/:restaurantId')
  async getRestaurantOrders(@Param('restaurantId') restaurantId) {
    return this.orderService.getOrdersByRestaurant(restaurantId);
  }

  @Get('restaurant')
  async getRestaurantOrdersFromToken(@Headers('authorization') auth) {
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

  @Get('stats/restaurant/:restaurantId')
  async getRestaurantStats(
    @Param('restaurantId') restaurantId, 
    @Query('startDate') startDate,
    @Query('endDate') endDate
  ) {
    return this.orderService.getOrderStats(restaurantId, new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  async getOrder(@Param('id') id) {
    const order = await this.orderService.getOrderById(id);
    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
    return order;
  }

  @Patch(':id/preparing')
  async startPreparing(@Param('id') id) {
    return this.orderService.startPreparing(id);
  }

  @Patch(':id/ready')
  async markReady(@Param('id') id) {
    return this.orderService.startReady(id);
  }

  @Patch(':id/delivering')
  async startDelivery(@Param('id') id, @Body() body) {
    const { distanceKm, etaMinutes } = body;
    if (distanceKm === undefined || etaMinutes === undefined) {
      throw new HttpException('Missing distance or ETA', HttpStatus.BAD_REQUEST);
    }
    return this.orderService.startDelivery(id, distanceKm, etaMinutes);
  }

  @Patch(':id/complete')
  async completeOrder(@Param('id') id) {
    return this.orderService.completeOrder(id);
  }

  @Patch(':id/cancel')
  async cancelOrder(@Param('id') id, @Body() body) {
    const { reason } = body;
    try {
      return await this.orderService.cancelOrder(id, reason || 'No reason provided');
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/restaurant-confirm')
  async restaurantConfirmOrder(@Param('id') id) {
    try {
      return await this.orderService.restaurantConfirmOrder(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id/restaurant-reject')
  async restaurantRejectOrder(@Param('id') id, @Body() body) {
    const { reason } = body;
    try {
      return await this.orderService.restaurantRejectOrder(id, reason || 'No reason provided');
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @MessagePattern('payment_confirmed')
  async handlePaymentConfirmed(@Payload() data) {
    return this.orderService.markOrderAsPaid(data.orderId, data.paymentId);
  }

  @MessagePattern('delivery_status_changed')
  async handleDeliveryStatusChange(@Payload() data) {
    return this.orderService.handleDeliveryStatusChange(data);
  }

}

module.exports = { OrderController };
