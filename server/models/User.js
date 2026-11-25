const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  issuedAt: { type: Date, default: Date.now },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  field: { type: String, default: '' },
  year: { type: String, default: '' },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  organization: { type: String, default: '' },
  duration: { type: String, default: '' },
  description: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['student', 'recruiter', 'mentor'],
    default: 'student',
  },
  headline: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  civicHours: { type: Number, default: 0, min: 0 },
  badges: [badgeSchema],
  skills: [{ type: String, trim: true }],
  interests: [{ type: String, trim: true }],
  education: [educationSchema],
  experience: [experienceSchema],
  linkedIn: { type: String, default: '' },
  github: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  resumeFileName: { type: String, default: '' },
  resumeText: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// Method: compare password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Virtual: safe profile (omit passwordHash)
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
