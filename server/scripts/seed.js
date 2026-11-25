require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentIdea = require('../models/StudentIdea');
const FeedPost = require('../models/FeedPost');
const Job = require('../models/Job');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora');
  console.log('[Seed] Connected to MongoDB');

  await Promise.all([
    User.deleteMany(),
    StudentIdea.deleteMany(),
    FeedPost.deleteMany(),
    Job.deleteMany(),
  ]);
  console.log('[Seed] Cleared existing data');

  const passwordHash = 'password123';

  const [student, mentor, recruiter, student2] = await User.create([
    {
      fullName: 'Alex Johnson',
      email: 'student@nexora.com',
      passwordHash,
      role: 'student',
      headline: 'Urban Sustainability Innovator & CS Student',
      bio: 'Passionate about using technology to solve civic challenges. 3x hackathon winner.',
      location: 'Bengaluru, India',
      civicHours: 42,
      skills: ['React', 'Node.js', 'GIS Mapping', 'Community Organizing'],
      badges: [
        { name: 'Civic Member', icon: '🌱' },
        { name: 'Eco Leader', icon: '🌿' },
        { name: 'Hackathon Winner', icon: '🏆' },
      ],
    },
    {
      fullName: 'Dr. Sarah Chen',
      email: 'mentor@nexora.com',
      passwordHash,
      role: 'mentor',
      headline: 'Smart Cities Expert | Former UN Habitat Advisor',
      bio: 'Over 15 years in sustainable urban development. PhD in Environmental Policy.',
      location: 'Singapore',
      civicHours: 480,
      skills: ['Smart Cities', 'Policy Design', 'Sustainability', 'GIS', 'Community Engagement'],
      badges: [
        { name: 'Verified Mentor', icon: '🎓' },
        { name: 'Civic Innovator', icon: '⚡' },
        { name: 'UN Advisor', icon: '🌐' },
      ],
    },
    {
      fullName: 'GreenFuture NGO',
      email: 'recruiter@nexora.com',
      passwordHash,
      role: 'recruiter',
      headline: 'Environmental NGO | Hiring Civic Innovators',
      location: 'Mumbai, India',
      civicHours: 0,
      skills: ['Recruitment', 'Environmental Policy', 'Grant Writing'],
      badges: [{ name: 'Impact Partner', icon: '🏢' }],
    },
    {
      fullName: 'Priya Sharma',
      email: 'priya@nexora.com',
      passwordHash,
      role: 'student',
      headline: 'Social Impact Designer & Public Health Advocate',
      location: 'Delhi, India',
      civicHours: 28,
      skills: ['Figma', 'Public Health', 'Data Analysis', 'Python'],
      badges: [
        { name: 'Civic Member', icon: '🌱' },
        { name: 'Health Champion', icon: '🏥' },
      ],
    },
  ]);

  await Job.create([
    {
      title: 'Civic Tech Full-Stack Intern',
      organization: 'GreenFuture NGO',
      description: 'Build open-source dashboards tracking urban solar adoption and community volunteer hours using React, Node.js, and MongoDB. Collaborate directly with climate policy analysts.',
      location: 'Remote / Hybrid',
      isRemote: true,
      type: 'internship',
      domain: 'environment',
      compensation: '₹25,000 / month',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS', 'REST API'],
      postedBy: recruiter._id,
    },
    {
      title: 'Climate Data & GIS Research Fellow',
      organization: 'Urban Resilience Lab',
      description: 'Analyze satellite flood-risk datasets with Python and GIS Mapping to help municipal governments protect vulnerable neighborhoods.',
      location: 'Bengaluru, India',
      isRemote: false,
      type: 'fellowship',
      domain: 'technology',
      compensation: '₹40,000 / month',
      requiredSkills: ['Python', 'GIS Mapping', 'Data Analysis', 'Machine Learning'],
      postedBy: mentor._id,
    },
    {
      title: 'Public Health Mobile Engineer (Flutter)',
      organization: 'CareBridge Foundation',
      description: 'Develop offline-first mobile screening apps in Flutter & Dart for rural community health workers.',
      location: 'Remote',
      isRemote: true,
      type: 'full-time',
      domain: 'health',
      compensation: '₹8–12 LPA',
      requiredSkills: ['Flutter', 'Dart', 'REST API', 'Public Health'],
      postedBy: recruiter._id,
    },
    {
      title: 'Youth Civic Outreach Lead',
      organization: 'OpenGov Collective',
      description: 'Coordinate university civic hackathons, write community grants, and mentor student teams launching local governance tools.',
      location: 'Delhi / Remote',
      isRemote: true,
      type: 'volunteer',
      domain: 'governance',
      compensation: 'Verified 60 Civic Hours + Certificate',
      requiredSkills: ['Community Organizing', 'Grant Writing', 'Public Speaking', 'Project Management'],
      postedBy: recruiter._id,
    },
  ]);

  const ideas = await StudentIdea.create([
    {
      title: 'Community Solar Microgrids for Rural Schools',
      description: 'Deploy affordable solar microgrids to 50 rural schools lacking reliable electricity, enabling digital learning and reducing carbon footprint by 200 tons annually.',
      domain: 'environment',
      author: student._id,
      mentor: mentor._id,
      teamSlots: 5,
      requiredSkills: ['Solar Engineering', 'GIS Mapping', 'React', 'Community Organizing'],
      tags: ['solar', 'education', 'sustainability', 'rural'],
      status: 'open',
    },
    {
      title: 'AI-Powered Flood Early Warning System',
      description: 'Build a low-cost IoT + machine learning flood prediction system for urban communities, sending SMS alerts 6 hours before flood events.',
      domain: 'technology',
      author: student2._id,
      teamSlots: 4,
      requiredSkills: ['IoT', 'Python', 'Machine Learning', 'Embedded Systems'],
      tags: ['ai', 'climate', 'disaster-prevention'],
      status: 'open',
    },
    {
      title: 'Multilingual Civic Rights App for Citizens',
      description: 'Mobile-first app providing legal rights, emergency contacts, and community resources in 15 languages with offline support.',
      domain: 'governance',
      author: student._id,
      teamSlots: 3,
      requiredSkills: ['Flutter', 'UI/UX', 'Legal Research', 'React'],
      tags: ['legal', 'mobile', 'diversity'],
      status: 'open',
    },
  ]);

  await FeedPost.create([
    {
      author: student._id,
      content: '🌿 Excited to announce our Community Solar Microgrids project is officially live on Nexora! Looking for collaborators to join our team.',
      type: 'idea-launch',
      tags: ['solar', 'education', 'teambuilding'],
      linkedIdea: ideas[0]._id,
    },
    {
      author: mentor._id,
      content: '🎓 Mentoring student civic innovators this month on Nexora. Upload your PDF resume to sharpen your profile and connect with teams!',
      type: 'general',
      tags: ['mentorship', 'innovation'],
    },
    {
      author: student2._id,
      content: '🏆 Milestone reached! Our AI Flood Warning System hit 94% accuracy in test simulations.',
      type: 'milestone',
      tags: ['ai', 'climate', 'milestone'],
    },
  ]);

  console.log('✅ Seed complete (4 users, 4 jobs, 3 ideas, 3 feed posts)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
