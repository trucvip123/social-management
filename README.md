# Social Management - Website Đăng Nội Dung Đồng Thời

Website cho phép người dùng đăng nội dung đồng thời lên Facebook, Instagram và Twitter từ một giao diện duy nhất.

## Tính năng chính

- ✅ Đăng ký và đăng nhập tài khoản
- ✅ Kết nối tài khoản Facebook, Instagram, Twitter
- ✅ Tạo bài đăng với nội dung text và media
- ✅ Đăng bài đồng thời lên nhiều mạng xã hội
- ✅ Lịch đăng bài (scheduled posts)
- ✅ Xem lịch sử bài đăng
- ✅ Dashboard thống kê
- ✅ Giao diện responsive với Material-UI

## Công nghệ sử dụng

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Facebook Graph API
- Twitter API v2
- Instagram Private API

### Frontend
- React.js
- Material-UI
- React Router
- Axios

## Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd SocialManagement
```

### 2. Cài đặt dependencies
```bash
# Cài đặt backend dependencies
npm install

# Cài đặt frontend dependencies
cd client
npm install
cd ..
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-super-secret-session-key

# Database
MONGODB_URI=mongodb://localhost:27017/social-management

# Client URL
CLIENT_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Facebook API
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_ACCESS_TOKEN=your-facebook-access-token

# Instagram API
INSTAGRAM_USERNAME=your-instagram-username
INSTAGRAM_PASSWORD=your-instagram-password

# Twitter API
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_ACCESS_TOKEN=your-twitter-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
```

### 4. Cài đặt MongoDB
Đảm bảo MongoDB đã được cài đặt và chạy trên máy local.

### 5. Chạy ứng dụng

#### Development mode:
```bash
# Terminal 1: Chạy backend
npm run dev

# Terminal 2: Chạy frontend
cd client
npm start
```

#### Production mode:
```bash
# Build frontend
cd client
npm run build
cd ..

# Chạy server
npm start
```

## Hướng dẫn sử dụng

### 1. Đăng ký tài khoản
- Truy cập http://localhost:3000
- Chọn "Đăng ký" và tạo tài khoản mới

### 2. Kết nối mạng xã hội
- Vào trang "Kết nối mạng xã hội"
- Kết nối từng platform một:
  - **Facebook**: Cần Access Token từ Facebook Developer
  - **Twitter**: Cần API Key, API Secret, Access Token từ Twitter Developer
  - **Instagram**: Cần username và password

### 3. Tạo bài đăng
- Vào trang "Tạo bài đăng"
- Nhập nội dung
- Chọn mạng xã hội muốn đăng
- Thêm hình ảnh/video (tùy chọn)
- Đặt lịch đăng (tùy chọn)
- Nhấn "Đăng bài"

### 4. Xem lịch sử
- Vào trang "Lịch sử đăng bài" để xem các bài đã đăng
- Có thể đăng lại bài nếu cần

## Cấu hình API Keys

### Facebook
1. Tạo app tại https://developers.facebook.com/
2. Lấy App ID và App Secret
3. Tạo Access Token với quyền publish_pages

### Twitter
1. Tạo app tại https://developer.twitter.com/
2. Lấy API Key và API Secret
3. Tạo Access Token và Access Token Secret

### Instagram
- Sử dụng username và password thật của tài khoản Instagram

## Cấu trúc thư mục

```
SocialManagement/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── App.js
├── config/                 # Database config
├── middleware/             # Auth middleware
├── models/                 # MongoDB models
├── routes/                 # API routes
├── services/               # Social media services
├── server.js              # Express server
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Social Connections
- `POST /api/social/connect/:platform` - Kết nối mạng xã hội
- `POST /api/social/disconnect/:platform` - Ngắt kết nối
- `GET /api/social/status` - Trạng thái kết nối

### Posts
- `POST /api/posts` - Tạo bài đăng
- `GET /api/posts` - Lấy danh sách bài đăng
- `POST /api/posts/:id/publish` - Đăng lại bài

## Lưu ý quan trọng

1. **Bảo mật**: Không commit file `.env` lên git
2. **Rate Limits**: Các API mạng xã hội có giới hạn request
3. **Instagram**: Sử dụng private API có thể bị giới hạn
4. **Facebook**: Cần phê duyệt app để sử dụng publish permissions

## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB đã chạy chưa
- Kiểm tra connection string trong .env

### Lỗi API mạng xã hội
- Kiểm tra API keys có đúng không
- Kiểm tra permissions của app
- Kiểm tra rate limits

### Lỗi CORS
- Kiểm tra CLIENT_URL trong .env
- Đảm bảo frontend và backend chạy đúng ports

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License - xem file LICENSE để biết thêm chi tiết. 