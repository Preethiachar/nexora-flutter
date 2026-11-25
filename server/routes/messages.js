const express = require('express');
const IdeaGroup = require('../models/IdeaGroup');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { uploadDocument, getFileType } = require('../middleware/upload');

const router = express.Router();

// ─── GET /messages/users/lookup?q=... (search teammates to add to group) ─────
router.get('/users/lookup', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, users: [] });
  const regex = { $regex: q, $options: 'i' };
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ fullName: regex }, { email: regex }],
  })
    .select('fullName email headline role avatarUrl')
    .limit(10);
  res.json({ success: true, users });
});

// ─── GET /messages/groups ─────────────────────────────────────────────────────
router.get('/groups', authMiddleware, async (req, res) => {
  const groups = await IdeaGroup.find({
    'members.user': req.user._id,
    isActive: true,
  })
    .populate('idea', 'title domain status')
    .populate('members.user', 'fullName email headline role avatarUrl')
    .sort({ createdAt: -1 });

  res.json({ success: true, groups });
});

// ─── POST /messages/groups (create custom collaboration group) ───────────────
router.post('/groups', authMiddleware, async (req, res) => {
  const { name, description = '', memberIds = [] } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }

  const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== req.user._id.toString())));
  const members = [
    { user: req.user._id, role: 'lead' },
    ...uniqueMemberIds.map((id) => ({ user: id, role: 'member' })),
  ];

  const group = new IdeaGroup({
    name: name.trim(),
    description: description.trim(),
    members,
  });
  await group.save();

  const welcome = new GroupMessage({
    group: group._id,
    sender: req.user._id,
    content: `💬 Group "${group.name}" created! Share messages, Word docs, PowerPoint decks, and PDFs here.`,
  });
  await welcome.save();

  await group.populate('members.user', 'fullName email headline role avatarUrl');
  res.status(201).json({ success: true, group });
});

// ─── GET /messages/groups/:groupId ───────────────────────────────────────────
router.get('/groups/:groupId', authMiddleware, async (req, res) => {
  const group = await IdeaGroup.findById(req.params.groupId)
    .populate('idea', 'title domain status milestones')
    .populate('members.user', 'fullName email headline role badges avatarUrl');

  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  const isMember = group.members.some((m) => m.user._id.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, group });
});

// ─── POST /messages/groups/:groupId/members (add member to group) ───────────
router.post('/groups/:groupId/members', authMiddleware, async (req, res) => {
  const { userId } = req.body;
  const group = await IdeaGroup.findById(req.params.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

  const targetUser = await User.findById(userId);
  if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

  const alreadyIn = group.members.some((m) => m.user.toString() === userId);
  if (!alreadyIn) {
    group.members.push({ user: userId, role: targetUser.role === 'mentor' ? 'mentor' : 'member' });
    await group.save();

    const sysMsg = new GroupMessage({
      group: group._id,
      sender: req.user._id,
      content: `👋 ${targetUser.fullName} was added to the group.`,
    });
    await sysMsg.save();
    await sysMsg.populate('sender', 'fullName email role avatarUrl');
    req.app.get('io').to(req.params.groupId).emit('new_message', sysMsg);
  }

  await group.populate('members.user', 'fullName email headline role badges avatarUrl');
  res.json({ success: true, group });
});

// ─── GET /messages/groups/:groupId/files (shared Word, PPT, PDFs) ───────────
router.get('/groups/:groupId/files', authMiddleware, async (req, res) => {
  const group = await IdeaGroup.findById(req.params.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

  const files = await GroupMessage.find({
    group: req.params.groupId,
    fileUrl: { $ne: null },
  })
    .populate('sender', 'fullName avatarUrl role')
    .sort({ createdAt: -1 });

  res.json({ success: true, files });
});

// ─── GET /messages/groups/:groupId/messages ───────────────────────────────────
router.get('/groups/:groupId/messages', authMiddleware, async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const group = await IdeaGroup.findById(req.params.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const messages = await GroupMessage.find({ group: req.params.groupId })
    .populate('sender', 'fullName email role avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, messages: messages.reverse(), page: parseInt(page) });
});

// ─── POST /messages/groups/:groupId/send ──────────────────────────────────────
router.post('/groups/:groupId/send', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) {
    return res.status(400).json({ success: false, message: 'Message content is required' });
  }

  const group = await IdeaGroup.findById(req.params.groupId);
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

  const message = new GroupMessage({
    group: req.params.groupId,
    sender: req.user._id,
    content: content.trim(),
  });

  await message.save();
  await message.populate('sender', 'fullName email role avatarUrl');

  const io = req.app.get('io');
  io.to(req.params.groupId).emit('new_message', message);

  res.status(201).json({ success: true, message });
});

// ─── POST /messages/groups/:groupId/upload (Word, PDF, PPT sharing) ──────────
router.post(
  '/groups/:groupId/upload',
  authMiddleware,
  uploadDocument.single('document'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded' });
    }

    const group = await IdeaGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some((m) => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied' });

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const fileType = getFileType(req.file.mimetype, req.file.originalname);
    const fileSizeKB = (req.file.size / 1024).toFixed(1);

    const message = new GroupMessage({
      group: req.params.groupId,
      sender: req.user._id,
      content: req.body.caption || '',
      fileUrl,
      fileName: req.file.originalname,
      fileType,
      fileSize: `${fileSizeKB} KB`,
      fileMimeType: req.file.mimetype,
    });

    await message.save();
    await message.populate('sender', 'fullName email role avatarUrl');

    const io = req.app.get('io');
    io.to(req.params.groupId).emit('new_message', message);

    res.status(201).json({ success: true, message });
  }
);

module.exports = router;
