const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra user đã tồn tại
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    // Tạo user mới
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        socialAccounts: user.socialAccounts
      }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  console.log('[LOGIN] Body:', req.body);
  try {
    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email });
    console.log('[LOGIN] User found:', !!user);
    if (!user) {
      console.log('[LOGIN] Sai email');
      return res.status(400).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Kiểm tra password
    const isMatch = await user.comparePassword(password);
    console.log('[LOGIN] Password match:', isMatch);
    if (!isMatch) {
      console.log('[LOGIN] Sai mật khẩu');
      return res.status(400).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-jwt-secret',
      { expiresIn: '7d' }
    );

    console.log('[LOGIN] Đăng nhập thành công:', user.email);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        socialAccounts: user.socialAccounts
      }
    });

  } catch (error) {
    console.error('[LOGIN] Lỗi đăng nhập:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Lấy thông tin user hiện tại
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        socialAccounts: req.user.socialAccounts
      }
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

module.exports = router; 