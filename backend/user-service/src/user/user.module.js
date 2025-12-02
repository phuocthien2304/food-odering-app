const { Module } = require('@nestjs/common');
const { MongooseModule } = require('@nestjs/mongoose');
const { JwtModule } = require('@nestjs/jwt');
const { UserController } = require('./user.controller');
const { UserService } = require('./user.service');
const { UserSchema } = require('./schemas/user.schema');

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema }
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret_key_change_in_production',
      signOptions: { expiresIn: '24h' }
    })
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
class UserModule {}

module.exports = { UserModule };
