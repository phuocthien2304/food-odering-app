require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ==== 1. CẤU HÌNH URI KẾT NỐI ====
const URIs = {
  gateway: process.env.MONGODB_URI_GATEWAY || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/api-gateway?retryWrites=true&w=majority&appName=Cluster0',
  user: process.env.MONGODB_URI_USER || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/user-service?retryWrites=true&w=majority&appName=Cluster0',
  restaurant: process.env.MONGODB_URI_RESTAURANT || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/restaurant-service?retryWrites=true&w=majority&appName=Cluster0',
  order: process.env.MONGODB_URI_ORDER || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/order-service?retryWrites=true&w=majority&appName=Cluster0',
  delivery: process.env.MONGODB_URI_DELIVERY || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/delivery-service?retryWrites=true&w=majority&appName=Cluster0',
  payment: process.env.MONGODB_URI_PAYMENT || 'mongodb+srv://phuocthien2304:phuocthien2304@cluster0.zpki9d4.mongodb.net/payment-service?retryWrites=true&w=majority&appName=Cluster0',
};

// ==== 2. ĐỊNH NGHĨA SCHEMAS (Copy chuẩn từ file bạn gửi) ====

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['CUSTOMER', 'RESTAURANT_STAFF', 'ADMIN'], default: 'CUSTOMER' },
  firstName: String,
  lastName: String,
  phoneNumber: String,
  defaultAddress: { street: String, ward: String, district: String, city: String, lat: Number, lng: Number },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

const RestaurantSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  description: String,
  phoneNumber: String,
  email: String,
  address: { street: String, ward: String, district: String, city: String },
  location: { lat: Number, lng: Number },
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean }
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  logo: String,
  banner: String
}, { timestamps: true });

const MenuSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, enum: ['APPETIZER', 'MAIN', 'DESSERT', 'BEVERAGE', 'COMBO'], required: true },
  isAvailable: { type: Boolean, default: true },
  quantity: { type: Number, default: -1 },
  image: String,
  preparationTime: Number,
  nutrition: { calories: Number, protein: Number, fat: Number, carbs: Number },
  allergens: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [{ menuItemId: mongoose.Schema.Types.ObjectId, name: String, price: Number, quantity: Number, notes: String }],
  subtotal: Number,
  deliveryFee: Number,
  total: Number,
  paymentMethod: { type: String, enum: ['COD', 'ONLINE'], required: true },
  status: { type: String, default: 'CREATED' },
  deliveryAddress: { street: String, ward: String, district: String, city: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const PaymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: Number,
  paymentMethod: { type: String, default: 'VNPAY' },
  status: { type: String, default: 'PENDING' },
  transactionId: String,
  initiatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  restaurantLocation: { lat: Number, lng: Number },
  customerLocation: { lat: Number, lng: Number },
  distanceKm: Number,
  etaMinutes: Number,
  status: { type: String, default: 'CONFIRMED' },
  createdAt: { type: Date, default: Date.now }
});

// ==== 3. HÀM SEED CHÍNH ====

async function seed() {
  console.log('🚀 Bắt đầu seed dữ liệu chuẩn Schema...');

  let createdUsers = [];
  let createdRestaurants = [];
  let createdMenus = []; // Lưu menu item để tạo order

  // 1. USER SERVICE
  {
    console.log('1️⃣  Seeding Users...');
    const conn = await mongoose.createConnection(URIs.user).asPromise();
    const User = conn.model('User', UserSchema);
    await User.deleteMany({});

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    const users = [
      {
        email: 'khachhang@demo.com', password: hashedPassword,
        firstName: 'Nguyen', lastName: 'An', userType: 'CUSTOMER', phoneNumber: '0901234567',
        isActive: true, isVerified: true,
        defaultAddress: { street: '123 Le Loi', ward: 'Ben Thanh', district: 'Quan 1', city: 'HCM', lat: 10.77, lng: 106.69 }
      },
      {
        email: 'admin@demo.com', password: hashedPassword,
        firstName: 'Admin', lastName: 'System', userType: 'ADMIN', phoneNumber: '0909999999',
        isActive: true, isVerified: true
      },
      {
        email: 'chuquan@demo.com', password: hashedPassword,
        firstName: 'Tran', lastName: 'Binh', userType: 'RESTAURANT_STAFF', phoneNumber: '0908888888',
        isActive: true, isVerified: true
      }
    ];

    createdUsers = await User.insertMany(users);
    console.log(`   ✔ Created ${createdUsers.length} users.`);
    await conn.close();
  }

  // 2. RESTAURANT SERVICE (Restaurant + Menu)
  {
    console.log('2️⃣  Seeding Restaurants & Menus...');
    const conn = await mongoose.createConnection(URIs.restaurant).asPromise();
    const Restaurant = conn.model('Restaurant', RestaurantSchema);
    const Menu = conn.model('Menu', MenuSchema);
    
    await Restaurant.deleteMany({});
    await Menu.deleteMany({});

    const owner = createdUsers.find(u => u.userType === 'RESTAURANT_STAFF') || createdUsers[0];

    // Giờ mở cửa mặc định
    const defaultHours = {
      open: '08:00', close: '22:00', isOpen: true
    };
    const operatingHours = {
      monday: defaultHours, tuesday: defaultHours, wednesday: defaultHours,
      thursday: defaultHours, friday: defaultHours, saturday: defaultHours, sunday: defaultHours
    };

    // --- Nhà hàng 1: Cơm Tấm ---
    const r1 = await Restaurant.create({
      ownerId: owner._id,
      name: 'Cơm Tấm Sài Gòn',
      description: 'Hương vị cơm tấm truyền thống',
      phoneNumber: '02833333333',
      email: 'comtam@demo.com',
      address: { street: '123 Nguyen Trai', ward: 'P2', district: 'Quan 5', city: 'HCM' },
      location: { lat: 10.755, lng: 106.68 },
      operatingHours,
      isActive: true, isVerified: true, rating: 4.5, totalReviews: 100
    });
    createdRestaurants.push(r1);

    const m1 = await Menu.insertMany([
      {
        restaurantId: r1._id, name: 'Cơm Sườn Bì Chả', description: 'Sườn nướng than hoa thơm lừng',
        price: 55000, category: 'MAIN', isAvailable: true,
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/C%C6%A1m_T%E1%BA%A5m_B%C3%A0_Ghi%E1%BB%81n_-_Da_Nang%2C_Vietnam.jpg/1200px-C%C6%A1m_T%E1%BA%A5m_B%C3%A0_Ghi%E1%BB%81n_-_Da_Nang%2C_Vietnam.jpg',
        nutrition: { calories: 600, protein: 30, fat: 20, carbs: 50 }
      },
      {
        restaurantId: r1._id, name: 'Canh Khổ Qua', description: 'Canh khổ qua dồn thịt',
        price: 15000, category: 'APPETIZER', isAvailable: true,
        nutrition: { calories: 150, protein: 10, fat: 5, carbs: 10 }
      }
    ]);
    createdMenus.push(...m1);

    // --- Nhà hàng 2: Trà Sữa ---
    const r2 = await Restaurant.create({
      ownerId: owner._id,
      name: 'Trà Sữa KOI Thé',
      description: 'Trà sữa nổi tiếng Đài Loan',
      phoneNumber: '02844444444',
      email: 'koi@demo.com',
      address: { street: '456 Hai Ba Trung', ward: 'Ben Nghe', district: 'Quan 1', city: 'HCM' },
      location: { lat: 10.780, lng: 106.69 },
      operatingHours,
      isActive: true, isVerified: true, rating: 4.8, totalReviews: 250
    });
    createdRestaurants.push(r2);

    await Menu.insertMany([
      {
        restaurantId: r2._id, name: 'Trà Sữa Trân Châu Hoàng Kim', description: 'Size L, 50% đường',
        price: 60000, category: 'BEVERAGE', isAvailable: true,
        allergens: ['DAIRY'],
        image: 'https://koithe.com/uploads/images/product/2021/01/05/Golden-Bubble-Milk-Tea.png'
      },
      {
        restaurantId: r2._id, name: 'Hồng Trà Macchiato', description: 'Size M, lớp kem béo ngậy',
        price: 45000, category: 'BEVERAGE', isAvailable: true,
        allergens: ['DAIRY']
      }
    ]);

    console.log(`   ✔ Created 2 restaurants and menus.`);
    await conn.close();
  }

  // 3. ORDER SERVICE
  let createdOrder;
  {
    console.log('3️⃣  Seeding Orders...');
    const conn = await mongoose.createConnection(URIs.order).asPromise();
    const Order = conn.model('Order', OrderSchema);
    await Order.deleteMany({});

    const customer = createdUsers.find(u => u.userType === 'CUSTOMER');
    const restaurant = createdRestaurants[0];
    const menuItem = createdMenus[0];

    createdOrder = await Order.create({
      customerId: customer._id,
      restaurantId: restaurant._id,
      items: [{
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 2,
        notes: 'Ít cay'
      }],
      subtotal: menuItem.price * 2,
      deliveryFee: 15000,
      total: (menuItem.price * 2) + 15000,
      paymentMethod: 'ONLINE',
      status: 'COMPLETED',
      deliveryAddress: { street: '123 Le Loi', ward: 'Ben Thanh', district: 'Quan 1', city: 'HCM' }
    });

    console.log(`   ✔ Created 1 order.`);
    await conn.close();
  }

  // 4. PAYMENT & DELIVERY
  {
    console.log('4️⃣  Seeding Payment & Delivery...');
    const connPayment = await mongoose.createConnection(URIs.payment).asPromise();
    const connDelivery = await mongoose.createConnection(URIs.delivery).asPromise();
    
    const Payment = connPayment.model('Payment', PaymentSchema);
    const Delivery = connDelivery.model('Delivery', DeliverySchema);

    await Payment.deleteMany({});
    await Delivery.deleteMany({});

    if (createdOrder) {
      await Payment.create({
        orderId: createdOrder._id,
        customerId: createdOrder.customerId,
        amount: createdOrder.total,
        paymentMethod: 'VNPAY',
        status: 'SUCCESS',
        transactionId: 'TXN_' + Date.now()
      });

      await Delivery.create({
        orderId: createdOrder._id,
        restaurantId: createdOrder.restaurantId,
        customerId: createdOrder.customerId,
        restaurantLocation: { lat: 10.755, lng: 106.68 },
        customerLocation: { lat: 10.77, lng: 106.69 },
        distanceKm: 2.5,
        etaMinutes: 15,
        status: 'DELIVERED'
      });
    }

    console.log(`   ✔ Created Payment & Delivery records.`);
    await connPayment.close();
    await connDelivery.close();
  }

  console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
}

seed().catch(err => {
  console.error('❌ Error seeding data:', err);
  process.exit(1);
});