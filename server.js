const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/database');
const cron = require('node-cron');
const Post = require('./models/Post');
const User = require('./models/User');
const { router: postsRouter, publishPost } = require('./routes/posts');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Ho_Chi_Minh');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// CORS configuration - sử dụng biến môi trường
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://74.249.129.209',
  'http://74.249.129.209:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Xử lý preflight OPTIONS requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration - tạm thời disable để fix CORS
/*
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/social-management'
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
*/

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/social', require('./routes/social'));
app.use('/api/posts', postsRouter);

// Health check endpoint
app.get('/api/auth/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve static files in production (only if not running in Docker)
if (process.env.NODE_ENV === 'production' && !process.env.DOCKER_ENV) {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(200).json({ success: false, message: 'CORS error' });
  }
  next(err);
  res.status(500).json({ 
    success: false, 
    message: 'Có lỗi xảy ra trên server',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Cron job: mỗi phút kiểm tra các bài post scheduled mà chưa đăng
cron.schedule('* * * * *', async () => {
  try {
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    console.log(`[CRON] Start at ${now.format()}`);
    let count = 0;
    while (true) {
      // Lấy 1 post đã đến hạn đăng, chưa đăng và set isPublished=true ngay khi lấy
      const post = await Post.findOneAndUpdate(
        {
          scheduledFor: { $lte: now.toDate() },
          isPublished: false
        },
        { $set: { isPublished: true } },
        { new: true }
      ).populate('user');
      if (!post) {
        if (count === 0) {
          console.log('[CRON] No scheduled post to publish.');
        }
        break;
      }
      count++;
      console.log(`[CRON] Picked post _id=${post._id}, scheduledFor=${post.scheduledFor}, isPublished(before)=false, isPublished(after)=${post.isPublished}`);
      // Gọi hàm publishPost đã có sẵn
      await publishPost(post, post.user);
      console.log(`[CRON] Scheduled post published _id=${post._id}`);
    }
    if (count > 0) {
      console.log(`[CRON] Total published this run: ${count}`);
    }
  } catch (err) {
    console.error('[CRON] Error processing scheduled post:', err);
  }
});

// Sau khi cấu hình app và trước app.listen
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Social Management API',
      version: '1.0.0',
      description: 'API documentation for Social Management',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Docker environment: ${process.env.DOCKER_ENV || 'false'}`);
}); 