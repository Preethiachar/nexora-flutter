const express = require('express');
const StudentIdea = require('../models/StudentIdea');
const IdeaGroup = require('../models/IdeaGroup');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ─── GET /marketplace/ideas ───────────────────────────────────────────────────
router.get('/ideas', authMiddleware, async (req, res) => {
  const { domain, status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (domain) filter.domain = domain;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { requiredSkills: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const ideas = await StudentIdea.find(filter)
    .populate('author', 'fullName email headline role avatarUrl civicHours badges')
    .populate('mentor', 'fullName email headline avatarUrl skills')
    .populate('members.user', 'fullName email headline avatarUrl skills')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await StudentIdea.countDocuments(filter);
  res.json({ success: true, ideas, total, page: parseInt(page), pages: Math.ceil(total / limit) });
});

// ─── POST /marketplace/ideas ──────────────────────────────────────────────────
router.post('/ideas', authMiddleware, async (req, res) => {
  const { title, description, domain, teamSlots, requiredSkills, tags, milestones } = req.body;

  if (!title || !description || !domain) {
    return res.status(400).json({ success: false, message: 'Title, description, and domain are required' });
  }

  const idea = new StudentIdea({
    title,
    description,
    domain,
    author: req.user._id,
    teamSlots: teamSlots || 4,
    requiredSkills: requiredSkills || [],
    tags: tags || [],
    milestones: milestones || [],
  });

  await idea.save();
  await idea.populate('author', 'fullName email headline role avatarUrl');

  res.status(201).json({ success: true, idea });
});

// ─── GET /marketplace/ideas/:id ───────────────────────────────────────────────
router.get('/ideas/:id', authMiddleware, async (req, res) => {
  const idea = await StudentIdea.findById(req.params.id)
    .populate('author', 'fullName email headline role avatarUrl civicHours badges skills')
    .populate('mentor', 'fullName email headline avatarUrl skills civicHours badges')
    .populate('members.user', 'fullName email headline avatarUrl skills');

  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });
  res.json({ success: true, idea });
});

// ─── POST /marketplace/ideas/:id/apply ───────────────────────────────────────
router.post('/ideas/:id/apply', authMiddleware, async (req, res) => {
  const idea = await StudentIdea.findById(req.params.id);
  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });
  if (idea.author.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot apply to your own idea' });
  }

  const alreadyApplied = idea.members.some(
    (m) => m.user.toString() === req.user._id.toString()
  );
  if (alreadyApplied) {
    return res.status(400).json({ success: false, message: 'Already applied to this idea' });
  }

  const acceptedCount = idea.members.filter((m) => m.status === 'accepted').length;
  if (acceptedCount >= idea.teamSlots) {
    return res.status(400).json({ success: false, message: 'No team slots available' });
  }

  idea.members.push({ user: req.user._id, status: 'pending', role: 'member' });
  await idea.save();
  res.json({ success: true, message: 'Application submitted! A collaboration group will open automatically once accepted.' });
});

// ─── POST /marketplace/ideas/:id/accept-member ───────────────────────────────
router.post('/ideas/:id/accept-member', authMiddleware, async (req, res) => {
  const { memberId, action } = req.body; // action: 'accept' | 'reject'

  const idea = await StudentIdea.findById(req.params.id).populate('members.user', 'fullName');
  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });
  if (idea.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the idea author can review applicants' });
  }

  const memberEntry = idea.members.find((m) => m.user._id.toString() === memberId);
  if (!memberEntry) return res.status(404).json({ success: false, message: 'Applicant not found' });

  memberEntry.status = action === 'accept' ? 'accepted' : 'rejected';
  await idea.save();

  const io = req.app.get('io');

  if (action === 'accept') {
    let group;
    if (!idea.groupId) {
      const groupMembers = [
        { user: idea.author, role: 'lead' },
        { user: memberId, role: 'member' },
      ];
      if (idea.mentor) groupMembers.push({ user: idea.mentor, role: 'mentor' });

      group = new IdeaGroup({
        idea: idea._id,
        name: `${idea.title} - Collab Group`,
        description: `Auto-created collaboration group for "${idea.title}"`,
        members: groupMembers,
      });
      await group.save();

      idea.groupId = group._id;
      idea.status = 'in-progress';
      await idea.save();

      const welcomeMsg = new GroupMessage({
        group: group._id,
        sender: idea.author,
        content: `🎉 Welcome to "${idea.title}" collaboration group! ${memberEntry.user.fullName} has been accepted onto the team. Use the paperclip to share Word, PDF, or PowerPoint files.`,
      });
      await welcomeMsg.save();
    } else {
      group = await IdeaGroup.findById(idea.groupId);
      if (group) {
        const alreadyIn = group.members.some((m) => m.user.toString() === memberId);
        if (!alreadyIn) {
          group.members.push({ user: memberId, role: 'member' });
          await group.save();

          const joinMsg = new GroupMessage({
            group: group._id,
            sender: idea.author,
            content: `👋 ${memberEntry.user.fullName} has joined the collaboration group!`,
          });
          await joinMsg.save();
          await joinMsg.populate('sender', 'fullName email role avatarUrl');
          io?.to(group._id.toString()).emit('new_message', joinMsg);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Member accepted and added to collaboration group!',
      group,
    });
  }

  res.json({ success: true, message: `Applicant ${action}ed successfully` });
});

// ─── GET /marketplace/mentors ─────────────────────────────────────────────────
router.get('/mentors', authMiddleware, async (req, res) => {
  const { skills, search } = req.query;
  const filter = { role: 'mentor' };
  if (skills) filter.skills = { $in: skills.split(',') };
  if (search) filter.fullName = { $regex: search, $options: 'i' };

  const mentors = await User.find(filter).select('-passwordHash').sort({ civicHours: -1 });
  res.json({ success: true, mentors });
});

// ─── POST /marketplace/ideas/:id/mentor ──────────────────────────────────────
router.post('/ideas/:id/mentor', authMiddleware, async (req, res) => {
  const { mentorId } = req.body;
  const idea = await StudentIdea.findById(req.params.id);
  if (!idea) return res.status(404).json({ success: false, message: 'Idea not found' });
  if (idea.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the author can assign a mentor' });
  }

  const mentor = await User.findById(mentorId);
  if (!mentor || mentor.role !== 'mentor') {
    return res.status(400).json({ success: false, message: 'Invalid mentor ID or user is not a mentor' });
  }

  idea.mentor = mentorId;
  await idea.save();
  await idea.populate('mentor', 'fullName email headline avatarUrl skills');

  if (idea.groupId) {
    const group = await IdeaGroup.findById(idea.groupId);
    if (group) {
      const alreadyIn = group.members.some((m) => m.user.toString() === mentorId);
      if (!alreadyIn) {
        group.members.push({ user: mentorId, role: 'mentor' });
        await group.save();
      }
    }
  }

  res.json({ success: true, message: 'Mentor assigned', idea });
});

module.exports = router;
