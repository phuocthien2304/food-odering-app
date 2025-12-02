const { Module } = require('@nestjs/common');
const { HttpModule } = require('@nestjs/axios');
const { GatewayController } = require('./gateway.controller');
const { GatewayService } = require('./gateway.service');

@Module({
  imports: [HttpModule],
  controllers: [GatewayController],
  providers: [GatewayService]
})
class AppModule {}

module.exports = { AppModule };
