const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const FacebookService = require('../services/facebookService');
const TwitterService = require('../services/twitterService');
const InstagramService = require('../services/instagramService');

const router = express.Router();

// Kết nối Facebook
router.post('/connect/facebook', auth, async (req, res) => {
  try {
    const { accessToken, pageId } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token Facebook là bắt buộc'
      });
    }

    const facebookService = new FacebookService(accessToken);
    
    // Kiểm tra token có hợp lệ không
    const isValid = await facebookService.validateToken();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Access token Facebook không hợp lệ'
      });
    }

    // Lấy thông tin user
    const userInfo = await facebookService.getUserInfo();
    
    // Cập nhật thông tin user
    const user = await User.findById(req.user.id);
    user.socialAccounts.facebook = {
      accessToken: accessToken,
      pageId: pageId || null,
      pageName: pageId ? 'Connected Page' : null,
      isConnected: true
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Kết nối Facebook thành công',
      userInfo: userInfo
    });

  } catch (error) {
    console.error('Lỗi kết nối Facebook:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết nối Facebook'
    });
  }
});

// Kết nối Twitter
router.post('/connect/twitter', auth, async (req, res) => {
  try {
    const { apiKey, apiSecret, accessToken, accessTokenSecret } = req.body;
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả thông tin Twitter API là bắt buộc'
      });
    }

    const twitterService = new TwitterService(apiKey, apiSecret, accessToken, accessTokenSecret);
    
    // Kiểm tra credentials có hợp lệ không
    const isValid = await twitterService.validateCredentials();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin Twitter API không hợp lệ'
      });
    }

    // Lấy thông tin user
    const userInfo = await twitterService.getUserInfo();
    
    // Cập nhật thông tin user
    const user = await User.findById(req.user.id);
    user.socialAccounts.twitter = {
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
      isConnected: true
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Kết nối Twitter thành công',
      userInfo: userInfo
    });

  } catch (error) {
    console.error('Lỗi kết nối Twitter:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết nối Twitter'
    });
  }
});

// Kết nối Instagram
router.post('/connect/instagram', auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username và password Instagram là bắt buộc'
      });
    }

    const instagramService = new InstagramService(username, password);
    
    // Kiểm tra credentials có hợp lệ không
    const isValid = await instagramService.validateCredentials();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Thông tin đăng nhập Instagram không hợp lệ'
      });
    }

    // Lấy thông tin user
    const userInfo = await instagramService.getUserInfo();
    
    // Cập nhật thông tin user
    const user = await User.findById(req.user.id);
    user.socialAccounts.instagram = {
      username: username,
      isConnected: true
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Kết nối Instagram thành công',
      userInfo: userInfo
    });

  } catch (error) {
    console.error('Lỗi kết nối Instagram:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết nối Instagram'
    });
  }
});

// Ngắt kết nối mạng xã hội
router.post('/disconnect/:platform', auth, async (req, res) => {
  try {
    const { platform } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }

    // Reset thông tin platform
    if (platform === 'facebook') {
      user.socialAccounts.facebook = {
        accessToken: null,
        pageId: null,
        pageName: null,
        isConnected: false
      };
    } else if (platform === 'twitter') {
      user.socialAccounts.twitter = {
        accessToken: null,
        accessTokenSecret: null,
        isConnected: false
      };
    } else if (platform === 'instagram') {
      user.socialAccounts.instagram = {
        username: null,
        isConnected: false
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Platform không hợp lệ'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `Đã ngắt kết nối ${platform} thành công`
    });

  } catch (error) {
    console.error('Lỗi ngắt kết nối:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi ngắt kết nối'
    });
  }
});

// Lấy trạng thái kết nối
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      socialAccounts: user.socialAccounts
    });

  } catch (error) {
    console.error('Lỗi lấy trạng thái:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy trạng thái kết nối'
    });
  }
});

module.exports = router; 