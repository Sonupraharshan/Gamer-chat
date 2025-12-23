const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const authMiddleware = require('../middleware/authMiddleware');

// ========== GROUP MANAGEMENT ==========

// Create new group/lobby
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Group.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }

    const group = new Group({
      name: name.trim(),
      description: description || '',
      admin: req.user.id,
      members: [], // Admin is NOT a member, they're the admin
      coAdmins: [],
      inviteCode
    });

    await group.save();
    await group.populate('admin members coAdmins', 'username status gameStatus');

    const groupObj = group.toObject();
    groupObj.userRole = 'admin'; // Creator is always admin
    groupObj.memberCount = 1; // Just the admin initially

    res.status(201).json({ 
      message: 'Group created successfully',
      group: groupObj
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's groups
router.get('/my-groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { admin: req.user.id },
        { coAdmins: req.user.id },
        { members: req.user.id }
      ]
    })
    .populate('admin', 'username')
    .sort({ updatedAt: -1 });

    // Add user role to each group
    const groupsWithRole = groups.map(group => {
      const groupObj = group.toObject();
      groupObj.userRole = group.getUserRole(req.user.id);
      // Count: 1 admin + co-admins + regular members
      groupObj.memberCount = 1 + (group.coAdmins?.length || 0) + (group.members?.length || 0);
      return groupObj;
    });

    res.json({ groups: groupsWithRole });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join group via invite code
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Invite code is required' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!group) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Check if already a member
    if (group.getUserRole(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user as member
    group.members.push(req.user.id);
    await group.save();
    await group.populate('admin members coAdmins', 'username status gameStatus');

    res.json({ 
      message: 'Successfully joined group',
      group 
    });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group details
router.get('/:groupId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'username status gameStatus')
      .populate('coAdmins', 'username status gameStatus')
      .populate('members', 'username status gameStatus');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    const userRole = group.getUserRole(req.user.id);
    if (!userRole) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const groupObj = group.toObject();
    groupObj.userRole = userRole;

    res.json({ group: groupObj });
  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave group
router.delete('/:groupId/leave', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Admin cannot leave without transferring
    if (group.isAdmin(req.user.id)) {
      return res.status(400).json({ message: 'Admin must transfer ownership before leaving' });
    }

    // Remove from co-admins or members
    if (group.isCoAdmin(req.user.id)) {
      group.coAdmins = group.coAdmins.filter(id => id.toString() !== req.user.id);
    } else {
      group.members = group.members.filter(id => id.toString() !== req.user.id);
    }

    await group.save();

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== MEMBER MANAGEMENT ==========

// Kick member
router.delete('/:groupId/kick/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const targetUserId = req.params.userId;
    const userRole = group.getUserRole(req.user.id);
    const targetRole = group.getUserRole(targetUserId);

    // Check permissions
    if (!userRole || userRole === 'member') {
      return res.status(403).json({ message: 'You do not have permission to kick members' });
    }

    // Cannot kick yourself
    if (req.user.id === targetUserId) {
      return res.status(400).json({ message: 'You cannot kick yourself' });
    }

    // Cannot kick admin
    if (targetRole === 'admin') {
      return res.status(400).json({ message: 'Cannot kick the admin' });
    }

    // Co-admin cannot kick other co-admins
    if (userRole === 'co-admin' && targetRole === 'co-admin') {
      return res.status(403).json({ message: 'Co-admins cannot kick other co-admins' });
    }

    // Remove user
    if (targetRole === 'co-admin') {
      group.coAdmins = group.coAdmins.filter(id => id.toString() !== targetUserId);
    } else {
      group.members = group.members.filter(id => id.toString() !== targetUserId);
    }

    await group.save();

    res.json({ 
      message: 'Member kicked successfully',
      kickedUserId: targetUserId 
    });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Promote to co-admin
router.patch('/:groupId/promote/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const targetUserId = req.params.userId;
    const userRole = group.getUserRole(req.user.id);
    const targetRole = group.getUserRole(targetUserId);

    // Only admin and co-admin can promote
    if (!userRole || userRole === 'member') {
      return res.status(403).json({ message: 'You do not have permission to promote members' });
    }

    // Can only promote regular members
    if (targetRole !== 'member') {
      return res.status(400).json({ message: 'User is already a co-admin or admin' });
    }

    // Move from members to co-admins
    group.members = group.members.filter(id => id.toString() !== targetUserId);
    group.coAdmins.push(targetUserId);

    await group.save();
    await group.populate('coAdmins', 'username');

    res.json({ 
      message: 'Member promoted to co-admin successfully',
      promotedUserId: targetUserId 
    });
  } catch (error) {
    console.error('Promote member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Demote from co-admin
router.patch('/:groupId/demote/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const targetUserId = req.params.userId;
    const userRole = group.getUserRole(req.user.id);
    const targetRole = group.getUserRole(targetUserId);

    // Only admin can demote co-admins
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admin can demote co-admins' });
    }

    // Can only demote co-admins
    if (targetRole !== 'co-admin') {
      return res.status(400).json({ message: 'User is not a co-admin' });
    }

    // Move from co-admins to members
    group.coAdmins = group.coAdmins.filter(id => id.toString() !== targetUserId);
    group.members.push(targetUserId);

    await group.save();

    res.json({ 
      message: 'Co-admin demoted to member successfully',
      demotedUserId: targetUserId 
    });
  } catch (error) {
    console.error('Demote member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer admin role
router.patch('/:groupId/transfer-admin/:userId', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const targetUserId = req.params.userId;
    const userRole = group.getUserRole(req.user.id);
    const targetRole = group.getUserRole(targetUserId);

    // Only current admin can transfer
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Only admin can transfer ownership' });
    }

    // Target must be a member of the group
    if (!targetRole) {
      return res.status(400).json({ message: 'Target user is not a member of this group' });
    }

    // Cannot transfer to yourself
    if (req.user.id === targetUserId) {
      return res.status(400).json({ message: 'You are already the admin' });
    }

    const oldAdmin = group.admin;

    // Remove target from their current position
    if (targetRole === 'co-admin') {
      group.coAdmins = group.coAdmins.filter(id => id.toString() !== targetUserId);
    } else {
      group.members = group.members.filter(id => id.toString() !== targetUserId);
    }

    // Set new admin
    group.admin = targetUserId;

    // Add old admin as co-admin
    group.coAdmins.push(oldAdmin);

    await group.save();
    await group.populate('admin coAdmins', 'username');

    res.json({ 
      message: 'Admin role transferred successfully',
      newAdmin: targetUserId,
      oldAdmin: oldAdmin 
    });
  } catch (error) {
    console.error('Transfer admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== MESSAGING ==========

// Send group message
router.post('/:groupId/message', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.getUserRole(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = new GroupMessage({
      group: req.params.groupId,
      sender: req.user.id,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'username');

    res.status(201).json({ 
      message: 'Message sent successfully',
      data: message 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/:groupId/messages', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.getUserRole(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const messages = await GroupMessage.find({ group: req.params.groupId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({ messages: messages.reverse() }); // Reverse to show oldest first
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite user to group by username
router.post('/:groupId/invite-user', authMiddleware, async (req, res) => {
  try {
    const { username } = req.body;
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const userRole = group.getUserRole(req.user.id);
    if (userRole !== 'admin' && userRole !== 'co-admin') {
      return res.status(403).json({ message: 'Only admins can invite users' });
    }

    // Find user by username
    const User = require('../models/User');
    const userToInvite = await User.findOne({ username: username.toLowerCase() });
    
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    if (group.isMember(userToInvite._id)) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Add user as member
    group.members.push(userToInvite._id);
    await group.save();

    res.json({ 
      message: `${username} has been invited to the group`,
      user: { _id: userToInvite._id, username: userToInvite.username }
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== HELPER FUNCTIONS ==========

function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = router;
