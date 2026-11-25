const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { uploadImage, uploadResume } = require('../middleware/upload');
const { extractTextFromPdf, parseResumeDetails } = require('../utils/resumeParser');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── POST /auth/register ─────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { fullName, email, password, role, headline, skills, location, bio } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const userRole = ['student', 'recruiter', 'mentor'].includes(role) ? role : 'student';

  const user = new User({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role: userRole,
    headline: headline || '',
    bio: bio || '',
    location: location || '',
    skills: Array.isArray(skills) ? skills : [],
    badges: userRole === 'mentor'
      ? [{ name: 'Verified Mentor', icon: '🎓' }]
      : userRole === 'recruiter'
      ? [{ name: 'Impact Partner', icon: '🏢' }]
      : [{ name: 'Civic Member', icon: '🌱' }],
  });

  await user.save();
  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    token,
    user,
  });
});

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = signToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user,
  });
});

// ─── GET /auth/me ────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── PATCH /auth/profile ─────────────────────────────────────────────────────
router.patch('/profile', authMiddleware, async (req, res) => {
  const allowedFields = [
    'fullName', 'headline', 'bio', 'skills', 'interests',
    'phone', 'location', 'education', 'experience',
    'linkedIn', 'github', 'portfolioUrl', 'resumeText',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, user });
});

// ─── POST /auth/avatar ───────────────────────────────────────────────────────
router.post('/avatar', authMiddleware, uploadImage.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please choose an image file' });
  }
  const avatarUrl = `/uploads/images/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatarUrl },
    { new: true }
  );
  res.json({ success: true, avatarUrl, user });
});

// ─── POST /auth/resume-upload (PDF extraction & profile enrichment) ──────────
router.post('/resume-upload', authMiddleware, uploadResume.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume' });
  }

  const resumeText = await extractTextFromPdf(req.file.path);
  const extracted = parseResumeDetails(resumeText);
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;

  const currentUser = await User.findById(req.user._id);
  const mergedSkills = Array.from(new Set([...(currentUser.skills || []), ...extracted.skills]));

  const updates = {
    resumeUrl,
    resumeFileName: req.file.originalname,
    resumeText,
    skills: mergedSkills,
  };
  if (!currentUser.phone && extracted.phone) updates.phone = extracted.phone;
  if (!currentUser.linkedIn && extracted.linkedIn) updates.linkedIn = extracted.linkedIn;
  if (!currentUser.github && extracted.github) updates.github = extracted.github;
  if (!currentUser.headline && extracted.headline) updates.headline = extracted.headline;
  if (!currentUser.bio && extracted.bio) updates.bio = extracted.bio;
  if ((!currentUser.education || currentUser.education.length === 0) && extracted.education.length > 0) {
    updates.education = extracted.education;
  }
  if ((!currentUser.experience || currentUser.experience.length === 0) && extracted.experience.length > 0) {
    updates.experience = extracted.experience;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

  res.json({
    success: true,
    message: 'PDF resume extracted and profile enriched',
    user,
    extracted,
  });
});

module.exports = router;
