const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { DeliveryController } = require('./delivery.controller');
const { DeliveryService } = require('./delivery.service');
const { DeliverySchema } = require('./schemas/delivery.schema');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Delivery', schema: DeliverySchema }
    ])
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService]
})
class DeliveryModule {}

module.exports = { DeliveryModule };
