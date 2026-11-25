const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { uploadResume } = require('../middleware/upload');
const { extractTextFromPdf, parseResumeDetails } = require('../utils/resumeParser');
const User = require('../models/User');
const Job = require('../models/Job');
const StudentIdea = require('../models/StudentIdea');

const router = express.Router();

// ─── Keyword Extraction (TF-IDF inspired, pure JS) ───────────────────────────
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by','from',
  'up','about','into','through','during','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could','should','may','might',
  'that','this','these','those','it','its','i','you','he','she','we','they','me','him',
  'her','us','them','my','your','his','our','their','what','which','who','when','where',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function extractKeywords(text, topN = 20) {
  const tokens = tokenize(text);
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function computeMatchScore(resumeKeywords, jobKeywords) {
  const resumeSet = new Set(resumeKeywords);
  const matched = jobKeywords.filter((k) => resumeSet.has(k));
  const missing = jobKeywords.filter((k) => !resumeSet.has(k));
  const score = jobKeywords.length > 0
    ? Math.round((matched.length / jobKeywords.length) * 100)
    : 0;
  return { score, matched, missing };
}

function buildAtsResult(resumeText, jobDescription) {
  const resumeKeywords = extractKeywords(resumeText, 40);
  const jobKeywords = extractKeywords(jobDescription, 30);
  const { score, matched, missing } = computeMatchScore(resumeKeywords, jobKeywords);

  let advice = '';
  if (score >= 80) {
    advice = `Excellent match! Your resume strongly aligns with this civic role. Focus on quantifying your impact (e.g., "Led 3 volunteer drives impacting 500+ community members"). Highlight your ${matched.slice(0, 3).join(', ')} expertise.`;
  } else if (score >= 60) {
    advice = `Good match! You meet most requirements. Strengthen your profile by emphasizing: ${missing.slice(0, 4).join(', ')}. Consider adding civic project milestones that demonstrate hands-on impact.`;
  } else if (score >= 40) {
    advice = `Moderate match. Prioritize building skills in: ${missing.slice(0, 5).join(', ')}. Look for opportunities or Idea Marketplace projects that build these competencies.`;
  } else {
    advice = `This role requires upskilling in: ${missing.slice(0, 6).join(', ')}. Join an active Idea Collaboration Group on Nexora to gain real-world project experience and civic hours.`;
  }

  const improvements = missing.slice(0, 8).map((kw) => ({
    keyword: kw,
    suggestion: `Add measurable project work or coursework involving "${kw}" to boost your ATS match.`,
  }));

  return {
    matchScore: score,
    matchedKeywords: matched,
    missingKeywords: missing,
    resumeKeywords,
    jobKeywords,
    careerAdvice: advice,
    improvements,
    analysisTimestamp: new Date().toISOString(),
  };
}

// ─── POST /ai/resume-ats ──────────────────────────────────────────────────────
router.post('/resume-ats', authMiddleware, async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({
      success: false,
      message: 'Both resumeText and jobDescription are required',
    });
  }

  const result = buildAtsResult(resumeText, jobDescription);
  res.json({ success: true, result });
});

// ─── POST /ai/resume-ats-pdf (Upload PDF resume + scan against job) ──────────
router.post('/resume-ats-pdf', authMiddleware, uploadResume.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume' });
  }
  const { jobDescription } = req.body;
  if (!jobDescription?.trim()) {
    return res.status(400).json({ success: false, message: 'Job description is required' });
  }

  const extractedText = await extractTextFromPdf(req.file.path);
  const extractedDetails = parseResumeDetails(extractedText);
  const result = buildAtsResult(extractedText, jobDescription);

  res.json({
    success: true,
    extractedText,
    extractedDetails,
    result,
  });
});

// ─── POST /ai/update-resume ───────────────────────────────────────────────────
router.post('/update-resume', authMiddleware, async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ success: false, message: 'resumeText required' });

  await User.findByIdAndUpdate(req.user._id, { resumeText });
  res.json({ success: true, message: 'Resume text updated for ATS scanning' });
});

// ─── POST /ai/copilot (Nexora AI Side Copilot) ───────────────────────────────
router.post('/copilot', authMiddleware, async (req, res) => {
  const { message = '', currentPage = '/jobs' } = req.body;
  const q = message.trim().toLowerCase();
  const user = req.user;

  const [jobs, ideas] = await Promise.all([
    Job.find({ isActive: true }).sort({ createdAt: -1 }).limit(6),
    StudentIdea.find({}).sort({ createdAt: -1 }).limit(6),
  ]);

  const userSkills = (user.skills || []).map((s) => s.toLowerCase());

  let reply = '';
  const actions = [];

  if (!q) {
    reply = `Hi ${user.fullName.split(' ')[0]}! I'm **Nexora AI**, your side copilot. I can recommend matching job opportunities, review your profile/PDF resume, suggest civic ideas to join, or help draft pitches and messages.`;
  } else if (q.includes('job') || q.includes('intern') || q.includes('opportunit') || q.includes('recommend') || q.includes('apply')) {
    const ranked = jobs
      .map((j) => {
        const overlap = (j.requiredSkills || []).filter((s) => userSkills.includes(s.toLowerCase())).length;
        return { job: j, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3);

    if (ranked.length === 0) {
      reply = 'There are no open opportunities yet. Recruiters or members can post new opportunities right from the Job Opportunities page!';
    } else {
      const list = ranked
        .map(({ job, overlap }) =>
          `• **${job.title}** at ${job.organization} (${job.type}, ${job.location})${overlap > 0 ? ` — ${overlap} skill match(es)` : ''}`
        )
        .join('\n');
      reply = `Here are the top opportunities on Nexora for you${user.skills?.length ? ` based on your skills (${user.skills.slice(0, 4).join(', ')})` : ''}:\n\n${list}\n\nTip: Upload your PDF resume on your Profile so one-click applications auto-calculate your ATS match score!`;
      actions.push({ label: 'Browse Jobs', path: '/jobs' });
    }
  } else if (q.includes('resume') || q.includes('pdf') || q.includes('ats') || q.includes('profile')) {
    const missing = [];
    if (!user.avatarUrl) missing.push('profile photo');
    if (!user.bio) missing.push('bio summary');
    if (!user.skills?.length) missing.push('skills');
    if (!user.resumeText) missing.push('PDF resume extraction');

    reply = missing.length === 0
      ? `Your profile looks strong, ${user.fullName.split(' ')[0]}! You have ${user.skills.length} skills listed, a bio, a profile photo, and an extracted resume (${user.resumeFileName || 'text'}). Run your resume against any job in the AI ATS Scanner to hit 80%+ match.`
      : `To make your profile stand out and boost ATS matches, add your: **${missing.join(', ')}**.\n\nYou can upload a **PDF Resume** directly on the Profile page — Nexora automatically extracts your skills, education, experience, and LinkedIn/GitHub links!`;
    actions.push({ label: 'Open Profile', path: '/profile' }, { label: 'Open AI ATS', path: '/ats' });
  } else if (q.includes('idea') || q.includes('pitch') || q.includes('team') || q.includes('group') || q.includes('mentor')) {
    const topIdeas = ideas.slice(0, 3).map((i) => `• **${i.title}** (${i.domain}, ${i.teamSlots} slots)`).join('\n');
    reply = `When you apply to an idea in the **Idea Marketplace** and the author accepts you, Nexora **automatically creates an Idea Collaboration Group** in **Messaging** with the team & mentor!\n\nInside the group chat you can share **Word (.docx)**, **PowerPoint (.pptx)**, and **PDF (.pdf)** files.\n\nActive ideas right now:\n${topIdeas || 'No ideas posted yet — launch the first one!'}`;
    actions.push({ label: 'Idea Marketplace', path: '/ideas' }, { label: 'Open Messaging', path: '/groups' });
  } else if (q.includes('word') || q.includes('ppt') || q.includes('powerpoint') || q.includes('message') || q.includes('chat')) {
    reply = `In **Messaging**, open any group chat and click the **Word**, **PPT**, **PDF**, or **Paperclip** button at the bottom bar to share .doc/.docx, .ppt/.pptx, or .pdf files up to 15 MB. You can also view all shared files in the group's **Shared Files** drawer!`;
    actions.push({ label: 'Go to Messaging', path: '/groups' });
  } else {
    reply = `I'm looking at your current workspace (**${currentPage}**). Here's what I can help with right now:\n\n• **Job Match**: Ask "recommend jobs for my skills"\n• **PDF Resume & Profile**: Ask "review my profile and resume"\n• **Ideas & Auto-Groups**: Ask "how do idea groups and mentors work?"\n• **Messaging & Docs**: Ask "how to share Word or PPT in group chat?"`;
  }

  res.json({
    success: true,
    reply,
    actions,
    context: {
      role: user.role,
      skillsCount: user.skills?.length || 0,
      hasResume: Boolean(user.resumeText),
      openJobsCount: jobs.length,
    },
  });
});

module.exports = router;
