const { Controller, Get, Param, Patch, Post, Body, Inject, HttpException, HttpStatus } = require('@nestjs/common');
const { MessagePattern, Payload, Ctx } = require('@nestjs/microservices');
const { DeliveryService } = require('./delivery.service');

@Controller('api/deliveries')
class DeliveryController {
  constructor(@Inject(DeliveryService) deliveryService) {
    this.deliveryService = deliveryService;
  }

  @MessagePattern('order_paid')
  async handleOrderPaid(@Payload() data) {
    try {
      return await this.deliveryService.createDelivery(data);
    } catch (error) {
      console.error('Error creating delivery:', error);
    }
  }

  @Get(':id')
  async getDelivery(@Param('id') id) {
    const delivery = await this.deliveryService.getDeliveryById(id);
    if (!delivery) {
      throw new HttpException('Delivery not found', HttpStatus.NOT_FOUND);
    }
    return delivery;
  }

  @Get('order/:orderId')
  async getByOrder(@Param('orderId') orderId) {
    const delivery = await this.deliveryService.getDeliveryByOrderId(orderId);
    if (!delivery) {
      throw new HttpException('Delivery not found', HttpStatus.NOT_FOUND);
    }
    return delivery;
  }

  @Post(':id/start')
  async startDelivery(@Param('id') id, @Body() body) {
    const { restaurantLat, restaurantLng, customerLat, customerLng } = body;
    if (!restaurantLat || !restaurantLng || !customerLat || !customerLng) {
      throw new HttpException('Missing location coordinates', HttpStatus.BAD_REQUEST);
    }
    return this.deliveryService.startDelivery(id, restaurantLat, restaurantLng, customerLat, customerLng);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id, @Body() body) {
    const { status } = body;
    if (!status) {
      throw new HttpException('Status is required', HttpStatus.BAD_REQUEST);
    }
    return this.deliveryService.updateStatus(id, status);
  }

  @Get('restaurant/:restaurantId/active')
  async getRestaurantDeliveries(@Param('restaurantId') restaurantId) {
    return this.deliveryService.getDeliveriesByRestaurant(restaurantId, 'DELIVERING');
  }
}

module.exports = { DeliveryController };
