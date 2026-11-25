const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const feedPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: null },
  tags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  type: {
    type: String,
    enum: ['general', 'milestone', 'announcement', 'volunteer', 'idea-launch'],
    default: 'general',
  },
  linkedIdea: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentIdea', default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FeedPost', feedPostSchema);
