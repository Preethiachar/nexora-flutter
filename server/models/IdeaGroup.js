const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['lead', 'mentor', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const ideaGroupSchema = new mongoose.Schema({
  idea: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentIdea', default: null },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  members: [groupMemberSchema],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IdeaGroup', ideaGroupSchema);
