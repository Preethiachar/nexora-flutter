const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'IdeaGroup', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  // Document attachment fields
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  fileType: {
    type: String,
    enum: ['word', 'pdf', 'ppt', 'image', 'other', null],
    default: null,
  },
  fileSize: { type: String, default: null },
  fileMimeType: { type: String, default: null },
  // Metadata
  isEdited: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
