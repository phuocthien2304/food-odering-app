const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { JwtModule } = require('@nestjs/jwt');
const { UserModule } = require('./user/user.module');

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key_change_in_production',
      signOptions: { expiresIn: '24h' }
    }),
    UserModule
  ]
})
class AppModule {}

module.exports = { AppModule };
