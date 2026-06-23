import api from './api.js';

// POST /api/ai/travel-agent
// timeout is 30 s because AI API calls can take 10-25 s.
export const askTravelAgent = async (tripId, message) => {
  const res = await api.post(
    '/ai/travel-agent',
    { tripId: Number(tripId), message },
    { timeout: 30_000 }
  );
  return res.data.data; // { message, applied, skipped }
};
