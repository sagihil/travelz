import api from './api.js';

// All interests in the DB (for the "Add existing" dropdown)
export const getAllInterests = async () => {
  const res = await api.get('/interests');
  return res.data.data;
};

// Interests the logged-in user has already saved
export const getUserInterests = async (userId) => {
  const res = await api.get(`/users/${userId}/interests`);
  return res.data.data;
};

// Add one existing interest to the user (immediate persistence)
export const addUserInterest = async (userId, interestId) => {
  const res = await api.post(`/users/${userId}/interests/${interestId}`);
  return res.data.data;
};

// Remove one interest from the user (immediate persistence)
export const removeUserInterest = async (userId, interestId) => {
  await api.delete(`/users/${userId}/interests/${interestId}`);
};

// Create a brand-new custom interest AND link it to the user in one call
export const createCustomInterest = async (name) => {
  const res = await api.post('/interests/custom', { name });
  return res.data.data; // { id, name, created }
};

// Full replace (kept for completeness, not used by the new UI)
export const setUserInterests = async (userId, interestIds) => {
  const res = await api.post(`/users/${userId}/interests`, { interestIds });
  return res.data.data;
};
