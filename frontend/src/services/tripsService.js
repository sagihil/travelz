import api from './api.js';

export const getAllTrips = async () => {
  const res = await api.get('/trips');
  return res.data.data;
};

export const getTripById = async (id) => {
  const res = await api.get(`/trips/${id}`);
  return res.data.data;
};

export const createTrip = async (data) => {
  const res = await api.post('/trips', data);
  return res.data.data;
};

export const updateTrip = async (id, data) => {
  const res = await api.put(`/trips/${id}`, data);
  return res.data.data;
};

export const deleteTrip = async (id) => {
  await api.delete(`/trips/${id}`);
};

export const getTripAttractions = async (tripId) => {
  const res = await api.get(`/trips/${tripId}/attractions`);
  return res.data.data;
};

export const addAttractionToTrip = async (tripId, attractionId, extras = {}) => {
  const res = await api.post(`/trips/${tripId}/attractions`, { attractionId, ...extras });
  return res.data.data;
};

export const removeAttractionFromTrip = async (tripId, attractionId) => {
  await api.delete(`/trips/${tripId}/attractions/${attractionId}`);
};
