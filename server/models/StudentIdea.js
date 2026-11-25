const mongoose = require('mongoose');

const memberEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  role: { type: String, default: 'member' },
  appliedAt: { type: Date, default: Date.now },
}, { _id: false });

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  completed: { type: Boolean, default: false },
}, { _id: true });

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  domain: {
    type: String,
    required: true,
    enum: ['environment', 'education', 'health', 'governance', 'technology', 'social-impact', 'other'],
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  teamSlots: { type: Number, default: 4, min: 1, max: 20 },
  requiredSkills: [{ type: String, trim: true }],
  members: [memberEntrySchema],
  milestones: [milestoneSchema],
  tags: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['draft', 'open', 'in-progress', 'completed', 'closed'],
    default: 'open',
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'IdeaGroup', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ideaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StudentIdea', ideaSchema);
