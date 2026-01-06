const { Injectable, Inject } = require('@nestjs/common');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { GatewayService } = require('./gateway.service');

@Injectable()
class EventListener {
  constructor(@Inject(GatewayService) gatewayService) {
    this.gatewayService = gatewayService;
    
    // Create RabbitMQ client to listen for events
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: 'api_gateway_queue',
        queueOptions: { durable: false },
      },
    });

    // Initialize listener
    this.initListener();
  }

  async initListener() {
    try {
      // Subscribe to order_paid_confirmed event
      this.client.subscribe('order_paid_confirmed', async (orderData) => {
        try {
          console.log('Received order_paid_confirmed event:', orderData._id);
          
          // Tự động tạo delivery cho đơn SePay đã thanh toán
          await this.gatewayService.createDelivery(orderData);
          console.log('Auto-created delivery for SePay order:', orderData._id);
        } catch (error) {
          console.error('Failed to auto-create delivery for SePay order:', error.message);
        }
      });

      await this.client.connect();
      console.log('✅ API Gateway event listener connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to initialize event listener:', error.message);
    }
  }
}

module.exports = { EventListener };
