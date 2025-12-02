const { Injectable, Inject } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { InjectModel } = require('@nestjs/mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

@Injectable()
class UserService {
  constructor(@InjectModel('User') userModel, @Inject(JwtService) jwtService) {
    this.UserModel = userModel;
    this.jwtService = jwtService;
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(registerDto) {
    const { email, password, firstName, lastName, userType } = registerDto;

    // Check if user exists
    const existingUser = await this.UserModel.findOne({ email }).exec();
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new this.UserModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userType: userType || 'CUSTOMER',
      verificationToken,
      isActive: true
    });

    return user.save();
  }

  async login(email, password) {
    const user = await this.UserModel.findOne({ email }).exec();
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    if (!user.isActive) {
      throw new Error('User account is inactive');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      id: user._id,
      email: user.email,
      userType: user.userType
    });

    // Update last login
    await this.UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).exec();

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        restaurantId: user.restaurantId
      }
    };
  }

  async verifyEmail(email, token) {
    const user = await this.UserModel.findOne({ email, verificationToken: token }).exec();
    
    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.isVerified = true;
    user.verificationToken = null;
    return user.save();
  }

  async getUserById(id) {
    return this.UserModel.findById(id).select('-password').exec();
  }

  async updateProfile(id, updateDto) {
    return this.UserModel.findByIdAndUpdate(
      id,
      { ...updateDto, updatedAt: new Date() },
      { new: true }
    ).select('-password').exec();
  }

  async changePassword(id, oldPassword, newPassword) {
    const user = await this.UserModel.findById(id).exec();
    
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await this.verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    user.password = await this.hashPassword(newPassword);
    return user.save();
  }

  async verifyToken(token) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUsersByType(userType) {
    return this.UserModel.find({ userType }).select('-password').exec();
  }

  async toggleUserStatus(id, isActive) {
    return this.UserModel.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true }
    ).select('-password').exec();
  }
}

module.exports = { UserService };
