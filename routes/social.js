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
        message: 'Access token Facebook is required'
      });
    }

    const facebookService = new FacebookService(accessToken);
    
    // Kiểm tra token có hợp lệ không
    const isValid = await facebookService.validateToken();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Access token Facebook is invalid'
      });
    }

    let facebookAccountData = {};

    if (pageId) {
      // Nếu có pageId, giả định đây là Page Access Token
      const pageInfo = await facebookService.getPageInfo(pageId, accessToken);
      facebookAccountData = {
        accessToken: accessToken,
        pageId: pageId,
        pageName: pageInfo.name,
        isConnected: true
      };
    } else {
      // Nếu không có pageId, giả định đây là User Access Token
      const userInfo = await facebookService.getUserInfo();
      facebookAccountData = {
        accessToken: accessToken,
        pageId: null,
        pageName: null,
        isConnected: true,
        userName: userInfo.name, // Lưu trữ tên người dùng
        userId: userInfo.id // Lưu trữ ID người dùng
      };
    }
    
    // Cập nhật thông tin user
    const user = await User.findById(req.user.id);
    user.socialAccounts.facebook = facebookAccountData;
    
    await user.save();

    res.json({
      success: true,
      message: 'Facebook connected successfully',
      socialAccount: facebookAccountData
    });

  } catch (error) {
    console.error('Lỗi kết nối Facebook:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Facebook',
      error: error.message
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
        message: 'All Twitter API information is required'
      });
    }

    const twitterService = new TwitterService(apiKey, apiSecret, accessToken, accessTokenSecret);
    
    // Kiểm tra credentials có hợp lệ không
    const isValid = await twitterService.validateCredentials();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Twitter API information'
      });
    }

    // Lấy thông tin user
    const userInfo = await twitterService.getUserInfo();
    
    // Cập nhật thông tin user
    const user = await User.findById(req.user.id);
    user.socialAccounts.twitter = {
      apiKey: apiKey,
      apiSecret: apiSecret,
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
      isConnected: true
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Twitter connected successfully',
      userInfo: userInfo
    });

  } catch (error) {
    console.error('Lỗi kết nối Twitter:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Twitter'
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
        message: 'Username and password Instagram are required'
      });
    }

    const instagramService = new InstagramService(username, password);
    
    // Kiểm tra credentials có hợp lệ không
    const isValid = await instagramService.validateCredentials();
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Instagram login information'
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
      message: 'Instagram connected successfully',
      userInfo: userInfo
    });

  } catch (error) {
    console.error('Lỗi kết nối Instagram:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting Instagram'
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
        message: 'User not found'
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
        message: 'Invalid platform'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: `Disconnected from ${platform} successfully`
    });

  } catch (error) {
    console.error('Lỗi ngắt kết nối:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting'
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
      message: 'Error fetching connection status'
    });
  }
});

module.exports = router; 