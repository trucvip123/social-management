const { IgApiClient } = require('instagram-private-api');

class InstagramService {
  constructor(username, password) {
    this.ig = new IgApiClient();
    this.username = username;
    this.password = password;
    this.isLoggedIn = false;
  }

  // Đăng nhập Instagram
  async login() {
    try {
      this.ig.state.generateDevice(this.username);
      await this.ig.account.login(this.username, this.password);
      this.isLoggedIn = true;
      return true;
    } catch (error) {
      console.error('Lỗi đăng nhập Instagram:', error);
      throw new Error('Không thể đăng nhập Instagram');
    }
  }

  // Đăng bài lên Instagram
  async postToFeed(content, mediaUrls = []) {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      if (mediaUrls.length === 0) {
        throw new Error('Instagram yêu cầu phải có hình ảnh hoặc video');
      }

      const publishOptions = {
        caption: content,
        file: await this.downloadMedia(mediaUrls[0]) // Instagram chỉ hỗ trợ 1 media cho feed
      };

      const result = await this.ig.publish.photo(publishOptions);
      return result;
    } catch (error) {
      console.error('Lỗi đăng bài Instagram:', error);
      throw new Error('Không thể đăng bài lên Instagram');
    }
  }

  // Đăng story
  async postToStory(content, mediaUrl) {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      const storyOptions = {
        file: await this.downloadMedia(mediaUrl),
        caption: content
      };

      const result = await this.ig.publish.story(storyOptions);
      return result;
    } catch (error) {
      console.error('Lỗi đăng story Instagram:', error);
      throw new Error('Không thể đăng story lên Instagram');
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
      if (!this.isLoggedIn) {
        await this.login();
      }

      const user = await this.ig.account.currentUser();
      return {
        id: user.pk,
        username: user.username,
        fullName: user.full_name,
        isPrivate: user.is_private
      };
    } catch (error) {
      console.error('Lỗi lấy thông tin user Instagram:', error);
      throw new Error('Không thể lấy thông tin user Instagram');
    }
  }

  // Kiểm tra credentials có hợp lệ không
  async validateCredentials() {
    try {
      await this.login();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Lấy feed
  async getFeed() {
    try {
      if (!this.isLoggedIn) {
        await this.login();
      }

      const feed = this.ig.feed.user(this.ig.state.cookieUserId);
      const posts = await feed.items();
      return posts;
    } catch (error) {
      console.error('Lỗi lấy feed Instagram:', error);
      throw new Error('Không thể lấy feed Instagram');
    }
  }
}

module.exports = InstagramService; 