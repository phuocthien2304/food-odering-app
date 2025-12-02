const { Injectable } = require('@nestjs/common');
const { ClientProxyFactory, Transport } = require('@nestjs/microservices');
const { InjectModel } = require('@nestjs/mongoose');
const crypto = require('crypto');

@Injectable()
class PaymentService {
  constructor(@InjectModel('Payment') paymentModel) {
    this.PaymentModel = paymentModel;

    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URI || 'amqp://localhost:5672'],
        queue: process.env.PAYMENT_QUEUE || 'payment_queue',
        queueOptions: { durable: false },
      },
    });
  }

  async initiatePayment(orderId, customerId, amount, paymentMethod = 'VNPAY') {
    const payment = new this.PaymentModel({
      orderId,
      customerId,
      amount,
      paymentMethod,
      status: 'PENDING',
      description: `Payment for order ${orderId}`
    });

    const saved = await payment.save();

    const paymentUrl = this.generatePaymentUrl(saved._id, amount, paymentMethod);
    payment.paymentUrl = paymentUrl;
    payment.redirectUrl = `${process.env.FRONTEND_URL}/payment/callback/${saved._id}`;
    await payment.save();

    return payment;
  }

  generatePaymentUrl(paymentId, amount, method) {
    const baseUrl = method === 'VNPAY' 
      ? process.env.VNPAY_GATEWAY_URL || 'https://sandbox.vnpayment.vn/paygate'
      : process.env.SEPAY_GATEWAY_URL || 'https://sepay.vn';
    
    const params = new URLSearchParams({
      payment_id: paymentId,
      amount: amount,
      description: `Payment for order`,
      return_url: `${process.env.PAYMENT_CALLBACK_URL}/payments/${paymentId}/callback`,
      timestamp: Date.now()
    });

    return `${baseUrl}?${params.toString()}`;
  }

  async getPaymentById(id) {
    return this.PaymentModel.findById(id).exec();
  }

  async getPaymentByOrderId(orderId) {
    return this.PaymentModel.findOne({ orderId }).exec();
  }

  async handlePaymentCallback(paymentId, callbackData) {
    const payment = await this.PaymentModel.findById(paymentId).exec();
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    const isValid = this.verifyCallbackSignature(callbackData, payment.paymentMethod);
    
    if (!isValid) {
      payment.status = 'FAILED';
      payment.errorMessage = 'Invalid callback signature';
      payment.failedAt = new Date();
      await payment.save();
      throw new Error('Invalid callback signature');
    }

    if (callbackData.ResponseCode === '00' || callbackData.vnp_ResponseCode === '00') {
      payment.status = 'SUCCESS';
      payment.transactionId = callbackData.TransactionNo || callbackData.vnp_TransactionNo;
      payment.transactionCode = callbackData.TransactionCode || callbackData.vnp_TransactionCode;
      payment.bankCode = callbackData.BankCode || callbackData.vnp_BankCode;
      payment.paidAt = new Date();

      await payment.save();

      this.client.emit('payment_confirmed', {
        paymentId: payment._id,
        orderId: payment.orderId,
        customerId: payment.customerId,
        amount: payment.amount,
        transactionId: payment.transactionId
      });

      return payment;
    } else {
      payment.status = 'FAILED';
      payment.errorMessage = callbackData.Message || callbackData.vnp_Message || 'Payment failed';
      payment.failedAt = new Date();
      await payment.save();

      this.client.emit('payment_failed', {
        paymentId: payment._id,
        orderId: payment.orderId,
        reason: payment.errorMessage
      });

      throw new Error(payment.errorMessage);
    }
  }

  verifyCallbackSignature(callbackData, method) {
    try {
      if (method === 'VNPAY') {
        const vnpSecureHash = callbackData.vnp_SecureHash;
        const secretKey = process.env.VNPAY_SECRET_KEY || 'SHOWCASESECRETKEY12345678';

        // Remove secure hash from params
        const params = { ...callbackData };
        delete params.vnp_SecureHash;

        // Sort and create hash string
        const sortedKeys = Object.keys(params).sort();
        let hashString = '';
        sortedKeys.forEach(key => {
          hashString += `&${key}=${params[key]}`;
        });
        hashString = hashString.substring(1);

        // Generate HMAC
        const hmac = crypto
          .createHmac('sha512', secretKey)
          .update(hashString)
          .digest('hex');

        return hmac === vnpSecureHash;
      } else if (method === 'SEPAY') {
        // Sepay signature verification
        const signature = callbackData.signature;
        const secretKey = process.env.SEPAY_SECRET_KEY || '';
        // Implement Sepay verification logic
        return true; // Simplified for now
      }
      return true;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async retryPayment(paymentId) {
    const payment = await this.PaymentModel.findById(paymentId).exec();
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.retryCount >= 3) {
      throw new Error('Maximum retry attempts exceeded');
    }

    payment.status = 'PENDING';
    payment.retryCount += 1;
    payment.paymentUrl = this.generatePaymentUrl(paymentId, payment.amount, payment.paymentMethod);
    
    return payment.save();
  }

  async refundPayment(paymentId, reason) {
    const payment = await this.PaymentModel.findById(paymentId).exec();
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'SUCCESS') {
      throw new Error('Can only refund successful payments');
    }

    payment.status = 'REFUNDED';
    payment.refundedAt = new Date();
    payment.description = `${payment.description} - Refunded: ${reason}`;

    const refunded = await payment.save();

    this.client.emit('payment_refunded', {
      paymentId: refunded._id,
      orderId: refunded.orderId,
      amount: refunded.amount,
      reason
    });

    return refunded;
  }

  async getPaymentStats(startDate, endDate) {
    const payments = await this.PaymentModel.find({
      initiatedAt: { $gte: startDate, $lte: endDate }
    }).exec();

    return {
      totalTransactions: payments.length,
      successfulPayments: payments.filter(p => p.status === 'SUCCESS').length,
      failedPayments: payments.filter(p => p.status === 'FAILED').length,
      refundedPayments: payments.filter(p => p.status === 'REFUNDED').length,
      totalRevenue: payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
      averageAmount: payments.length > 0 
        ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length 
        : 0
    };
  }
}

module.exports = { PaymentService };
