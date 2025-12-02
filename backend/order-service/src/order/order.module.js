const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { OrderController } = require('./order.controller');
const { OrderService } = require('./order.service');
const { OrderSchema } = require('./schemas/order.schema');

/**
 * Feature module encapsulating the order domain. Responsible for
 * registering the schema and providing the controller and service.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema }
    ])
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})
class OrderModule {}

module.exports = { OrderModule };
