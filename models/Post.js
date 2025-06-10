const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  media: [{
    type: String, // URL của hình ảnh/video
    required: false
  }],
  platforms: {
    facebook: {
      enabled: { type: Boolean, default: false },
      postId: String,
      status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
      error: String
    },
    instagram: {
      enabled: { type: Boolean, default: false },
      postId: String,
      status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
      error: String
    },
    twitter: {
      enabled: { type: Boolean, default: false },
      postId: String,
      status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
      error: String
    }
  },
  scheduledFor: {
    type: Date,
    required: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ scheduledFor: 1, isPublished: 0 });

module.exports = mongoose.model('Post', postSchema); 