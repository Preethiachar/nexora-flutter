const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverNote: { type: String, default: '' },
  matchScore: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected'],
    default: 'applied',
  },
  appliedAt: { type: Date, default: Date.now },
}, { _id: false });

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  organization: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, default: 'Remote' },
  isRemote: { type: Boolean, default: true },
  type: {
    type: String,
    enum: ['internship', 'full-time', 'part-time', 'fellowship', 'volunteer'],
    default: 'internship',
  },
  domain: {
    type: String,
    enum: ['environment', 'education', 'health', 'governance', 'technology', 'social-impact', 'other'],
    default: 'social-impact',
  },
  compensation: { type: String, default: 'Paid / Stipend' },
  requiredSkills: [{ type: String, trim: true }],
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [applicationSchema],
  deadline: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', jobSchema);
