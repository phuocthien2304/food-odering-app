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

  splitFullName(name) {
    const raw = String(name || '').trim();
    if (!raw) return { firstName: '', lastName: '' };
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  normalizeUser(userDoc) {
    if (!userDoc) return userDoc;
    const obj = typeof userDoc.toObject === 'function' ? userDoc.toObject() : userDoc;
    const firstName = obj.firstName || '';
    const lastName = obj.lastName || '';
    const name = String(`${firstName} ${lastName}`).trim();
    return { ...obj, name };
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
    const fullName = registerDto && typeof registerDto.name !== 'undefined' ? registerDto.name : undefined;
    const fromFullName = typeof fullName !== 'undefined' && (!firstName && !lastName) ? this.splitFullName(fullName) : null;

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
      firstName: fromFullName ? fromFullName.firstName : firstName,
      lastName: fromFullName ? fromFullName.lastName : lastName,
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
        name: String(`${user.firstName || ''} ${user.lastName || ''}`).trim(),
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
    const user = await this.UserModel.findById(id).select('-password').exec();
    return this.normalizeUser(user);
  }

  async updateProfile(id, updateDto) {
    const dto = { ...(updateDto || {}) };
    if (typeof dto.name !== 'undefined') {
      const splitted = this.splitFullName(dto.name);
      dto.firstName = splitted.firstName;
      dto.lastName = splitted.lastName;
      delete dto.name;
    }

    const user = await this.UserModel.findByIdAndUpdate(
      id,
      { ...dto, updatedAt: new Date() },
      { new: true }
    ).select('-password').exec();

    return this.normalizeUser(user);
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
