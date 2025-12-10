import axios from './axios';

// Create group
export const createGroup = async (name, description) => {
  const response = await axios.post('/api/group/create', { name, description });
  return response.data;
};

// Get user's groups
export const getMyGroups = async () => {
  const response = await axios.get('/api/group/my-groups');
  return response.data;
};

// Join group via invite code
export const joinGroup = async (inviteCode) => {
  const response = await axios.post('/api/group/join', { inviteCode });
  return response.data;
};

// Get group details
export const getGroupDetails = async (groupId) => {
  const response = await axios.get(`/api/group/${groupId}`);
  return response.data;
};

// Leave group
export const leaveGroup = async (groupId) => {
  const response = await axios.delete(`/api/group/${groupId}/leave`);
  return response.data;
};

// Kick member
export const kickMember = async (groupId, userId) => {
  const response = await axios.delete(`/api/group/${groupId}/kick/${userId}`);
  return response.data;
};

// Promote member to co-admin
export const promoteMember = async (groupId, userId) => {
  const response = await axios.patch(`/api/group/${groupId}/promote/${userId}`);
  return response.data;
};

// Demote co-admin to member
export const demoteMember = async (groupId, userId) => {
  const response = await axios.patch(`/api/group/${groupId}/demote/${userId}`);
  return response.data;
};

// Transfer admin role
export const transferAdmin = async (groupId, userId) => {
  const response = await axios.patch(`/api/group/${groupId}/transfer-admin/${userId}`);
  return response.data;
};

// Send message
export const sendMessage = async (groupId, content) => {
  const response = await axios.post(`/api/group/${groupId}/message`, { content });
  return response.data;
};

// Get messages
export const getMessages = async (groupId, limit = 50, skip = 0) => {
  const response = await axios.get(`/api/group/${groupId}/messages`, {
    params: { limit, skip }
  });
  return response.data;
};

// Invite user by username
export const inviteUser = async (groupId, username) => {
  const response = await axios.post(`/api/group/${groupId}/invite-user`, { username });
  return response.data;
};

// Search users (using existing user search endpoint)
export const searchUsers = async (username) => {
  const response = await axios.get(`/api/user/search?username=${username}`);
  return response.data;
};
