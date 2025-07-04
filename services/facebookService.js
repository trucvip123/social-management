const axios = require('axios');

class FacebookService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://graph.facebook.com/v18.0';
  }

  // Lấy danh sách pages của user
  async getPages() {
    try {
      const response = await axios.get(`${this.baseURL}/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,access_token'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching Facebook pages:', error.response?.data || error.message);
      throw new Error('Không thể lấy danh sách pages Facebook');
    }
  }

  // Đăng bài lên Facebook page
  async postToPage(pageId, pageAccessToken, content, mediaUrls = []) {
    try {
      let postData = {
        message: content,
        access_token: pageAccessToken
      };

      // Nếu có media, tạo album hoặc đăng từng ảnh
      if (mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          // Đăng 1 ảnh
          postData.source = mediaUrls[0];
          const response = await axios.post(`${this.baseURL}/${pageId}/photos`, postData);
          return response.data;
        } else {
          // Đăng nhiều ảnh
          const response = await axios.post(`${this.baseURL}/${pageId}/feed`, {
            message: content,
            attached_media: mediaUrls.map(url => ({ media_fbid: url })),
            access_token: pageAccessToken
          });
          return response.data;
        }
      } else {
        // Đăng text only
        const response = await axios.post(`${this.baseURL}/${pageId}/feed`, postData);
        return response.data;
      }
    } catch (error) {
      console.error('Error posting to Facebook:', error.response?.data || error.message);
      throw new Error('Không thể đăng bài lên Facebook');
    }
  }

  // Lấy thông tin user
  async getUserInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,email'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Facebook user info:', error.response?.data || error.message);
      throw new Error('Không thể lấy thông tin user Facebook');
    }
  }

  // Lấy thông tin page
  async getPageInfo(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/${pageId}`, {
        params: {
          access_token: pageAccessToken,
          fields: 'id,name'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching page info ${pageId}:`, error.response?.data || error.message);
      throw new Error(`Không thể lấy thông tin page ${pageId}`);
    }
  }

  // Kiểm tra token có hợp lệ không
  async validateToken() {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          access_token: this.accessToken
        }
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = FacebookService; 