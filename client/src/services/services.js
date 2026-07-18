import api from './api'

export const authService = {
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  sendOtp: (email, purpose) => api.post('/auth/send-otp', { email, purpose }),
  verifyOtp: (email, otp, purpose) => api.post('/auth/verify-otp', { email, otp, purpose }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
}

export const galleryService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/gallery?${query}`);
  },
  upload:     (formData) => api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:     (id) => api.delete(`/gallery/${id}`),
  like:       (id) => api.post(`/gallery/${id}/like`),
  favorite:   (id) => api.post(`/gallery/${id}/favorite`),
  comment:    (id, text) => api.post(`/gallery/${id}/comment`, { text }),
  delComment: (id, cid) => api.delete(`/gallery/${id}/comment/${cid}`),
  getAlbums:  () => api.get('/gallery/albums'),
}

export const eventService = {
  getAll:  () => api.get('/events'),
  create:  (data) => api.post('/events', data),
  update:  (id, data) => api.put(`/events/${id}`, data),
  delete:  (id) => api.delete(`/events/${id}`),
  rsvp:    (id, status) => api.post(`/events/${id}/rsvp`, { status }),
  addExpense: (id, data) => api.post(`/events/${id}/expense`, data),
}

export const memberService = {
  getAll:     () => api.get('/users'),
  getOne:     (id) => api.get(`/users/${id}`),
  update:     (id, data) => api.put(`/users/${id}`, data),
  updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
  uploadAvatar: (id, formData) => api.put(`/users/${id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getBirthdays: () => api.get('/users/birthdays'),
  getDashboardStats: () => api.get('/users/dashboard-stats'),
  getActivities: () => api.get('/users/activities'),
  getFamilyTree: () => api.get('/users/tree'),
  createFamilyMember: (data) => api.post('/users/tree/member', data),
  deleteFamilyMember: (id) => api.delete(`/users/tree/member/${id}`),
  updateRelations: (id, data) => api.put(`/users/${id}/relations`, data),
}

export const chatService = {
  getRooms:               () => api.get('/chat/rooms'),
  initGangChat:           () => api.post('/chat/gang-init'),
  getOrCreatePrivateRoom: (userId) => api.post(`/chat/room/private/${userId}`),
  createGroupRoom:        (data) => api.post('/chat/room/group', data),
  getMessages:            (roomId) => api.get(`/chat/room/${roomId}/messages`),
  sendMessage:            (roomId, formData) => api.post(`/chat/room/${roomId}/message`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editMessage:            (msgId, text) => api.put(`/chat/message/${msgId}`, { text }),
  deleteMessage:          (msgId) => api.delete(`/chat/message/${msgId}`),
  reactMessage:           (msgId, emoji) => api.post(`/chat/message/${msgId}/react`, { emoji }),
  markRead:               (msgId) => api.post(`/chat/message/${msgId}/read`),
  sendAiMessage:          (message) => api.post('/chat/ai', { message }),
}

export const notifService = {
  getAll:    () => api.get('/notifications'),
  markRead:  (id) => api.put(`/notifications/${id}/read`),
  markAll:   () => api.put('/notifications/read-all'),
}

export const pollService = {
  getAll: () => api.get('/polls'),
  create: (data) => api.post('/polls', data),
  vote:   (id, optionIndex) => api.post(`/polls/${id}/vote`, { optionIndex }),
  delete: (id) => api.delete(`/polls/${id}`),
}

export const gameService = {
  submitScore: (game, score) => api.post('/games/score', { game, score }),
  getLeaderboard: () => api.get('/games/leaderboard'),
  getHistory: (userId = '') => api.get(`/games/history/${userId}`),
}

export const adminService = {
  getMembers: () => api.get('/admin/members'),
  addMember: (data) => api.post('/admin/members', data),
  fixPasswords: () => api.post('/admin/fix-passwords'),
  changeRole:   (id, role) => api.put(`/admin/members/${id}/role`, { role }),
  removeMember: (id) => api.delete(`/admin/members/${id}`),
  getInvites:   () => api.get('/admin/invites'),
  createInvite: () => api.post('/admin/invites'),
  getAnalytics: () => api.get('/admin/analytics'),
  pushNotification: (data) => api.post('/admin/push', data),
  resetUserPassword: (id, newPassword) => api.put(`/users/${id}/admin-reset-password`, { newPassword }),
  updateUserPoints: (id, points) => api.put(`/users/${id}/admin-update-points`, { points }),
  updateUserGamePoints: (id, gamePoints) => api.put(`/users/${id}/admin-update-game-points`, { gamePoints }),
}

export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read')
}
