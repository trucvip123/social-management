const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/social-management?authSource=admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB đã kết nối: ${conn.connection.host}`);
  } catch (error) {
    console.error('Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;