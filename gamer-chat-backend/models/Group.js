const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coAdmins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isGameChannel: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Generate unique invite code
GroupSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Check if user is admin
GroupSchema.methods.isAdmin = function(userId) {
  const adminId = this.admin?._id || this.admin;
  return adminId?.toString() === userId.toString();
};

// Check if user is co-admin
GroupSchema.methods.isCoAdmin = function(userId) {
  return this.coAdmins.some(coAdmin => {
    const id = coAdmin?._id || coAdmin;
    return id?.toString() === userId.toString();
  });
};

// Check if user is member
GroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    const id = member?._id || member;
    return id?.toString() === userId.toString();
  });
};

// Get user role in group
GroupSchema.methods.getUserRole = function(userId) {
  if (this.isAdmin(userId)) return 'admin';
  if (this.isCoAdmin(userId)) return 'co-admin';
  if (this.isMember(userId)) return 'member';
  return null;
};

module.exports = mongoose.model('Group', GroupSchema);
