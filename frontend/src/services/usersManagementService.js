// services/usersManagementService.js
// ------------------------------------
// Purpose: API calls for the /api/users resource (admin/manager operations).
//
// Backend endpoints:
//   GET    /api/users      – returns all users (no auth required)
//   POST   /api/users      – create user (admin only)
//   PUT    /api/users/:id  – update user (admin or manager)
//   DELETE /api/users/:id  – delete user (admin only)
//
// The Authorization header is injected by the api.js interceptor on
// mutating requests (POST, PUT, DELETE require authentication on the backend).

import api from './api.js';

// ---------------------------------------------------------------------------
// getAllUsers()
// Returns the full array of user objects (passwords are stripped by backend).
// ---------------------------------------------------------------------------
export const getAllUsers = async () => {
  const res = await api.get('/users');
  return res.data.data;
};

// ---------------------------------------------------------------------------
// createUser(data)
// Required: { firstName, lastName, userRole }
// Optional: { email, password } – backend applies defaults if omitted.
// ---------------------------------------------------------------------------
export const createUser = async (data) => {
  const res = await api.post('/users', data);
  return res.data.data;
};

// ---------------------------------------------------------------------------
// updateUser(id, data)
// Required: { firstName, lastName, userRole }
// Note: email and password cannot be changed through this endpoint.
// ---------------------------------------------------------------------------
export const updateUser = async (id, data) => {
  const res = await api.put(`/users/${id}`, data);
  return res.data.data;
};

// ---------------------------------------------------------------------------
// deleteUser(id)
// Removes the user with the given numeric id.
// ---------------------------------------------------------------------------
export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};
