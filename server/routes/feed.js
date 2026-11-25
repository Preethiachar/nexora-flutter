const express = require('express');
const FeedPost = require('../models/FeedPost');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ─── GET /feed ────────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const filter = {};
  if (type) filter.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const posts = await FeedPost.find(filter)
    .populate('author', 'fullName headline role avatarUrl badges civicHours')
    .populate('comments.user', 'fullName avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FeedPost.countDocuments(filter);
  res.json({ success: true, posts, total, page: parseInt(page) });
});

// ─── POST /feed ───────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { content, tags, type, linkedIdea } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content is required' });

  const post = new FeedPost({
    author: req.user._id,
    content: content.trim(),
    tags: tags || [],
    type: type || 'general',
    linkedIdea: linkedIdea || null,
  });

  await post.save();
  await post.populate('author', 'fullName headline role avatarUrl badges');

  const io = req.app.get('io');
  io.emit('new_feed_post', post);

  res.status(201).json({ success: true, post });
});

// ─── POST /feed/:id/like ──────────────────────────────────────────────────────
router.post('/:id/like', authMiddleware, async (req, res) => {
  const post = await FeedPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  const userId = req.user._id.toString();
  const liked = post.likes.map((id) => id.toString()).includes(userId);

  if (liked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  res.json({ success: true, liked: !liked, likesCount: post.likes.length });
});

// ─── POST /feed/:id/comment ───────────────────────────────────────────────────
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment content required' });

  const post = await FeedPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  post.comments.push({ user: req.user._id, content: content.trim() });
  await post.save();
  await post.populate('comments.user', 'fullName');

  res.status(201).json({ success: true, comment: post.comments[post.comments.length - 1] });
});

module.exports = router;
