const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const StudentIdea = require('../models/StudentIdea');
const FeedPost = require('../models/FeedPost');
const Job = require('../models/Job');

const router = express.Router();

// ─── GET /search?q=:query&category=all|people|ideas|jobs|posts ───────────────
router.get('/', authMiddleware, async (req, res) => {
  const { q, category = 'all', limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
  }

  const regex = { $regex: q.trim(), $options: 'i' };
  const lim = Math.min(parseInt(limit), 30);

  const results = { people: [], ideas: [], jobs: [], posts: [] };

  if (category === 'all' || category === 'people') {
    results.people = await User.find({
      $or: [{ fullName: regex }, { headline: regex }, { skills: regex }],
    })
      .select('fullName email headline role avatarUrl civicHours badges skills')
      .limit(lim);
  }

  if (category === 'all' || category === 'ideas') {
    results.ideas = await StudentIdea.find({
      $or: [{ title: regex }, { description: regex }, { requiredSkills: regex }, { tags: regex }],
    })
      .populate('author', 'fullName headline avatarUrl')
      .select('title description domain status teamSlots requiredSkills createdAt')
      .limit(lim);
  }

  if (category === 'all' || category === 'jobs') {
    results.jobs = await Job.find({
      isActive: true,
      $or: [{ title: regex }, { organization: regex }, { description: regex }, { requiredSkills: regex }],
    })
      .select('title organization type location domain compensation requiredSkills createdAt')
      .limit(lim);
  }

  if (category === 'all' || category === 'posts') {
    results.posts = await FeedPost.find({
      $or: [{ content: regex }, { tags: regex }],
    })
      .populate('author', 'fullName headline role avatarUrl')
      .select('content type tags likes createdAt')
      .limit(lim);
  }

  const totalResults =
    results.people.length + results.ideas.length + results.jobs.length + results.posts.length;

  res.json({
    success: true,
    query: q,
    category,
    totalResults,
    results,
  });
});

module.exports = router;
