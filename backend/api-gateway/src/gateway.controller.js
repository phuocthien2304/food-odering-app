const { Controller, Get, Post, Patch, Body, Param, Headers, HttpException, HttpStatus, Inject, Query } = require('@nestjs/common');
const { GatewayService } = require('./gateway.service');

@Controller('api')
class GatewayController {
  constructor(@Inject(GatewayService) gatewayService) {
    this.gatewayService = gatewayService;
  }

  // ==================== AUTH ENDPOINTS ====================
  @Post('auth/register')
  async register(@Body() registerDto) {
    try {
      return await this.gatewayService.register(registerDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('auth/login')
  async login(@Body() loginDto) {
    try {
      return await this.gatewayService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('auth/verify-email')
  async verifyEmail(@Body() body) {
    try {
      return await this.gatewayService.verifyEmail(body);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('auth/verify-token')
  async verifyToken(@Headers('authorization') authHeader) {
    // SỬA: Dùng cách viết an toàn (&&) thay vì (?.) để tránh lỗi format
    const token = authHeader && authHeader.replace('Bearer ', '');
    try {
      return await this.gatewayService.verifyToken(token);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  // 👇 ROUTE MỚI CHO PROFILE (Đặt TRƯỚC route :id) 👇
  @Get('auth/profile')
  async getProfileByToken(@Headers('authorization') authHeader) {
    const token = authHeader && authHeader.replace('Bearer ', '');
    if (!token) {
      throw new HttpException('No token provided', HttpStatus.UNAUTHORIZED);
    }
    try {
      return await this.gatewayService.getProfileByToken(token);
    } catch (error) {
      throw new HttpException(error.message || 'Invalid Token', error.status || HttpStatus.UNAUTHORIZED);
    }
  }
  // 👆 HẾT ROUTE MỚI 👆

  @Get('auth/profile/:id')
  async getProfile(@Param('id') id) {
    try {
      return await this.gatewayService.getProfile(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Patch('auth/profile/:id')
  async updateProfile(@Param('id') id, @Body() updateDto) {
    try {
      return await this.gatewayService.updateProfile(id, updateDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== RESTAURANT ENDPOINTS ====================
  @Get('restaurants')
  async getRestaurants() {
    try {
      return await this.gatewayService.getRestaurants();
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('restaurants/:id')
  async getRestaurantById(@Param('id') id) {
    try {
      return await this.gatewayService.getRestaurantById(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Get('restaurants/search')
  async searchRestaurants(@Query('q') keyword) {
    try {
      return await this.gatewayService.searchRestaurants(keyword);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('restaurants/:id/menu')
  async getRestaurantMenu(@Param('id') id) {
    try {
      return await this.gatewayService.getRestaurantMenu(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  // ==================== ORDER ENDPOINTS ====================
  @Post('orders')
  async createOrder(@Body() orderDto) {
    try {
      return await this.gatewayService.createOrder(orderDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id) {
    try {
      return await this.gatewayService.getOrder(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Get('customers/:customerId/orders')
  async getCustomerOrders(@Param('customerId') customerId) {
    try {
      return await this.gatewayService.getCustomerOrders(customerId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Patch('orders/:id/confirm')
  async confirmOrder(@Param('id') id) {
    try {
      return await this.gatewayService.confirmOrder(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('orders/:id/cancel')
  async cancelOrder(@Param('id') id, @Body() body) {
    try {
      return await this.gatewayService.cancelOrder(id, body.reason);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  // ==================== PAYMENT ENDPOINTS ====================
  @Post('payments/initiate')
  async initiatePayment(@Body() paymentDto) {
    try {
      return await this.gatewayService.initiatePayment(paymentDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Get('payments/:id')
  async getPayment(@Param('id') id) {
    try {
      return await this.gatewayService.getPayment(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  // ==================== DELIVERY ENDPOINTS ====================
  @Get('deliveries/:id')
  async getDelivery(@Param('id') id) {
    try {
      return await this.gatewayService.getDelivery(id);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Get('deliveries/order/:orderId')
  async getDeliveryByOrder(@Param('orderId') orderId) {
    try {
      return await this.gatewayService.getDeliveryByOrder(orderId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Post('deliveries/:id/start')
  async startDelivery(@Param('id') id, @Body() data) {
    try {
      return await this.gatewayService.startDelivery(id, data);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}

module.exports = { GatewayController };