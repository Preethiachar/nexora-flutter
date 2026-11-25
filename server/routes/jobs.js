const express = require('express');
const Job = require('../models/Job');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function computeQuickMatch(user, job) {
  const text = `${user.resumeText || ''} ${(user.skills || []).join(' ')} ${user.headline || ''} ${user.bio || ''}`.toLowerCase();
  const targets = (job.requiredSkills && job.requiredSkills.length > 0)
    ? job.requiredSkills.map((s) => s.toLowerCase())
    : job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  if (targets.length === 0) return 50;
  const matched = targets.filter((skill) => text.includes(skill)).length;
  return Math.min(100, Math.max(15, Math.round((matched / targets.length) * 100)));
}

// ─── GET /jobs ────────────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { type, domain, search, remote } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (domain) filter.domain = domain;
  if (remote === 'true') filter.isRemote = true;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { organization: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { requiredSkills: { $regex: search, $options: 'i' } },
    ];
  }

  const jobs = await Job.find(filter)
    .populate('postedBy', 'fullName headline role avatarUrl')
    .sort({ createdAt: -1 });

  res.json({ success: true, jobs });
});

// ─── POST /jobs ───────────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { title, organization, description, location, isRemote, type, domain, compensation, requiredSkills } = req.body;
  if (!title || !organization || !description) {
    return res.status(400).json({ success: false, message: 'Title, organization, and description are required' });
  }

  const job = new Job({
    title: title.trim(),
    organization: organization.trim(),
    description: description.trim(),
    location: location || 'Remote',
    isRemote: isRemote !== undefined ? isRemote : true,
    type: type || 'internship',
    domain: domain || 'social-impact',
    compensation: compensation || 'Paid / Stipend',
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    postedBy: req.user._id,
  });

  await job.save();
  await job.populate('postedBy', 'fullName headline role avatarUrl');
  res.status(201).json({ success: true, job });
});

// ─── POST /jobs/:id/apply ─────────────────────────────────────────────────────
router.post('/:id/apply', authMiddleware, async (req, res) => {
  const { coverNote = '' } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ success: false, message: 'Opportunity not found' });

  const alreadyApplied = job.applicants.some((a) => a.user.toString() === req.user._id.toString());
  if (alreadyApplied) {
    return res.status(400).json({ success: false, message: 'You have already applied to this opportunity' });
  }

  const matchScore = computeQuickMatch(req.user, job);
  job.applicants.push({
    user: req.user._id,
    coverNote,
    matchScore,
    status: 'applied',
  });
  await job.save();

  res.json({
    success: true,
    message: 'Application submitted successfully',
    matchScore,
  });
});

// ─── GET /jobs/:id/applicants ─────────────────────────────────────────────────
router.get('/:id/applicants', authMiddleware, async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('applicants.user', 'fullName email headline avatarUrl skills civicHours resumeUrl');
  if (!job) return res.status(404).json({ success: false, message: 'Opportunity not found' });
  if (job.postedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the opportunity poster can view applicants' });
  }
  res.json({ success: true, applicants: job.applicants });
});

module.exports = router;
