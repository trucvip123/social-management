const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const FacebookService = require('../services/facebookService');
const TwitterService = require('../services/twitterService');
const InstagramService = require('../services/instagramService');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(timezone);

const router = express.Router();

// Tạo bài đăng mới
router.post('/', auth, async (req, res) => {
  try {
    const { content, media, platforms, scheduledFor } = req.body;
    // Convert scheduledFor từ Asia/Ho_Chi_Minh sang UTC trước khi lưu
    let scheduledForUTC = scheduledFor ? dayjs.tz(scheduledFor, 'Asia/Ho_Chi_Minh').utc().toDate() : null;
    console.log("ScheduledFor", scheduledFor);
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung bài đăng là bắt buộc'
      });
    }

    const user = await User.findById(req.user.id);
    const connectedPlatforms = Object.keys(user.socialAccounts).filter(
      platform => user.socialAccounts[platform].isConnected
    );

    if (connectedPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bạn cần kết nối ít nhất 1 mạng xã hội trước khi đăng bài'
      });
    }

    const post = new Post({
      user: req.user.id,
      content: content.trim(),
      media: media || [],
      platforms: {
        facebook: { enabled: platforms?.facebook || false, status: 'pending' },
        instagram: { enabled: platforms?.instagram || false, status: 'pending' },
        twitter: { enabled: platforms?.twitter || false, status: 'pending' }
      },
      scheduledFor: scheduledForUTC,
      isPublished: !scheduledFor
    });

    await post.save();

    if (!scheduledFor) {
      await publishPost(post, user);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo bài đăng thành công',
      post: {
        ...post.toObject(),
        scheduledFor: post.scheduledFor ? dayjs(post.scheduledFor).tz('Asia/Ho_Chi_Minh').format() : null,
        createdAt: dayjs(post.createdAt).tz('Asia/Ho_Chi_Minh').format(),
        updatedAt: dayjs(post.updatedAt).tz('Asia/Ho_Chi_Minh').format()
      }
    });

  } catch (error) {
    console.error('Lỗi tạo bài đăng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bài đăng'
    });
  }
});

// Lấy danh sách bài đăng
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await Post.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Post.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      posts: posts.map(post => ({
        ...post.toObject(),
        scheduledFor: post.scheduledFor ? dayjs(post.scheduledFor).tz('Asia/Ho_Chi_Minh').format() : null,
        createdAt: dayjs(post.createdAt).tz('Asia/Ho_Chi_Minh').format(),
        updatedAt: dayjs(post.updatedAt).tz('Asia/Ho_Chi_Minh').format()
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total: total
    });

  } catch (error) {
    console.error('Lỗi lấy danh sách bài đăng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài đăng'
    });
  }
});

// Đăng lại bài đăng
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài đăng'
      });
    }

    const user = await User.findById(req.user.id);
    await publishPost(post, user);

    res.json({
      success: true,
      message: 'Đăng lại bài đăng thành công',
      post: post
    });

  } catch (error) {
    console.error('Lỗi đăng lại bài đăng:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng lại bài đăng'
    });
  }
});

// Hàm đăng bài lên các mạng xã hội
async function publishPost(post, user) {
  // Đăng lên Facebook
  if (post.platforms.facebook.enabled && user.socialAccounts.facebook.isConnected) {
    try {
      const facebookService = new FacebookService(user.socialAccounts.facebook.accessToken);
      const result = await facebookService.postToPage(
        user.socialAccounts.facebook.pageId,
        user.socialAccounts.facebook.accessToken,
        post.content,
        post.media
      );
      
      post.platforms.facebook.status = 'posted';
      post.platforms.facebook.postId = result.id;
    } catch (error) {
      post.platforms.facebook.status = 'failed';
      post.platforms.facebook.error = error.message;
    }
  }

  // Đăng lên Twitter
  if (post.platforms.twitter.enabled && user.socialAccounts.twitter.isConnected) {
    try {
      const twitterService = new TwitterService(
        user.socialAccounts.twitter.apiKey,
        user.socialAccounts.twitter.apiSecret,
        user.socialAccounts.twitter.accessToken,
        user.socialAccounts.twitter.accessTokenSecret
      );
      
      const result = await twitterService.postTweet(post.content, post.media);
      
      post.platforms.twitter.status = 'posted';
      post.platforms.twitter.postId = result.id;
    } catch (error) {
      post.platforms.twitter.status = 'failed';
      post.platforms.twitter.error = error.message;
    }
  }

  // Đăng lên Instagram
  if (post.platforms.instagram.enabled && user.socialAccounts.instagram.isConnected) {
    try {
      const instagramService = new InstagramService(
        user.socialAccounts.instagram.username,
        process.env.INSTAGRAM_PASSWORD
      );
      
      const result = await instagramService.postToFeed(post.content, post.media);
      
      post.platforms.instagram.status = 'posted';
      post.platforms.instagram.postId = result.id;
    } catch (error) {
      post.platforms.instagram.status = 'failed';
      post.platforms.instagram.error = error.message;
    }
  }

  post.isPublished = true;
  await post.save();
}

module.exports = { router, publishPost }; 