const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { OrderModule } = require('./order/order.module');

/**
 * Root module for the order service. It establishes the MongoDB
 * connection and provides the order feature module.
 */
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    OrderModule
  ]
})
class AppModule {}

module.exports = { AppModule };
