const { TwitterApi } = require('twitter-api-v2');

class TwitterService {
  constructor(apiKey, apiSecret, accessToken, accessTokenSecret) {
    this.client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
  }

  // Đăng tweet
  async postTweet(content, mediaUrls = []) {
    try {
      let tweetData = {
        text: content
      };

      // Nếu có media, upload trước
      if (mediaUrls.length > 0) {
        const mediaIds = [];
        
        for (const mediaUrl of mediaUrls) {
          try {
            // Download media từ URL
            const mediaBuffer = await this.downloadMedia(mediaUrl);
            const mediaId = await this.client.v1.uploadMedia(mediaBuffer);
            mediaIds.push(mediaId);
          } catch (error) {
            console.error('Lỗi upload media:', error);
          }
        }

        if (mediaIds.length > 0) {
          tweetData.media = { media_ids: mediaIds };
        }
      }

      const tweet = await this.client.v2.tweet(tweetData);
      return tweet.data;
    } catch (error) {
      console.error('Lỗi đăng tweet:', error);
      throw new Error('Không thể đăng tweet');
    }
  }

  // Download media từ URL
  async downloadMedia(url) {
    try {
      const axios = require('axios');
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Lỗi download media:', error);
      throw new Error('Không thể download media');
    }
  }

  // Lấy thông tin user
  async getUserInfo() {
    try {
      const user = await this.client.v2.me();
      return user.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin user Twitter:', error);
      throw new Error('Không thể lấy thông tin user Twitter');
    }
  }

  // Kiểm tra credentials có hợp lệ không
  async validateCredentials() {
    try {
      await this.client.currentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Lấy timeline
  async getTimeline() {
    try {
      const timeline = await this.client.v2.userTimeline();
      return timeline.data;
    } catch (error) {
      console.error('Lỗi lấy timeline:', error);
      throw new Error('Không thể lấy timeline');
    }
  }
}

module.exports = TwitterService; 