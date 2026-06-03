// services/attractionsService.js
// --------------------------------
// Purpose: API calls for the /api/attractions resource.
//
// Backend endpoints:
//   GET    /api/attractions      – returns all attractions (public)
//   POST   /api/attractions      – create attraction (admin only)
//   PUT    /api/attractions/:id  – update attraction (admin or manager)
//   DELETE /api/attractions/:id  – delete attraction (admin only)
//
// The Authorization header is injected automatically by the api.js interceptor.
// All functions throw on non-2xx responses (Axios default); callers use try/catch.

import api from './api.js';

// ---------------------------------------------------------------------------
// getAllAttractions()
// Returns the full array of attraction objects from the backend.
// ---------------------------------------------------------------------------
export const getAllAttractions = async () => {
  const res = await api.get('/attractions');
  return res.data.data;
};

// ---------------------------------------------------------------------------
// createAttraction(data)
// data: { name, city, country, category, price, rating, user_id }
// user_id is the userId of the authenticated admin creating the record.
// ---------------------------------------------------------------------------
export const createAttraction = async (data) => {
  const res = await api.post('/attractions', data);
  return res.data.data;
};

// ---------------------------------------------------------------------------
// updateAttraction(id, data)
// id:   numeric attraction id
// data: { name, city, country, category, price, rating, user_id }
// ---------------------------------------------------------------------------
export const updateAttraction = async (id, data) => {
  const res = await api.put(`/attractions/${id}`, data);
  return res.data.data;
};

// ---------------------------------------------------------------------------
// deleteAttraction(id)
// Removes the attraction with the given id.
// ---------------------------------------------------------------------------
export const deleteAttraction = async (id) => {
  await api.delete(`/attractions/${id}`);
};
