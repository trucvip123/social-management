# Sử dụng Node.js 18 Alpine để giảm kích thước image
FROM node:18-alpine

# Cài đặt curl cho health check
RUN apk add --no-cache curl

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm ci --only=production

# Sao chép source code
COPY . .

# Tạo thư mục logs
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:5000/api/auth/health || exit 1

# Chạy ứng dụng
CMD ["npm", "start"]

# Set timezone
ENV TZ=Asia/Ho_Chi_Minh 