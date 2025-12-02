const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { DeliveryModule } = require('./delivery/delivery.module');

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    DeliveryModule
  ]
})
class AppModule {}

module.exports = { AppModule };
