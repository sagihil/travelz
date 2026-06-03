// vite.config.js
// ---------------
// Purpose: Vite build tool configuration for the TravelZ frontend.
// - Registers the React plugin so Vite understands JSX syntax.
// - Locks the dev-server to port 5173 as required by the assignment.
// - No proxy is needed because the backend already enables CORS for this origin.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
