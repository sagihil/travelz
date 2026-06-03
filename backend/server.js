// server.js
// ---------
// Purpose: Express application entry point.
//
// All API routes are served under the /api prefix so they are clearly separated
// from any static-file serving that might be added later.
//
// Route map:
//   POST   /api/auth/login        → authenticate a user, return a session token
//   POST   /api/auth/logout       → invalidate the active session token
//   GET    /api/users             → list all users
//   GET    /api/users/me          → return the authenticated user's profile
//   GET    /api/users/:id         → return one user
//   POST   /api/users             → create a user
//   PUT    /api/users/:id         → update a user (admin/manager)
//   DELETE /api/users/:id         → delete a user (admin)
//   GET    /api/attractions        → list all attractions (supports ?country= filter)
//   GET    /api/attractions/:id    → return one attraction
//   POST   /api/attractions        → create an attraction
//   PUT    /api/attractions/:id    → update an attraction (admin/manager)
//   DELETE /api/attractions/:id    → delete an attraction (admin)
//   GET    /api/settings           → return the authenticated user's settings
//   PUT    /api/settings           → update the authenticated user's settings
//
// CORS: requests from the React frontend at http://localhost:5173 are allowed.
//       The custom CORS headers are set here rather than via the cors package
//       to avoid adding an extra dependency.

const express = require("express");
const app     = express();

const authRoutes        = require("./routes/authRoutes");
const usersRoutes       = require("./routes/usersRoutes");
const attractionsRoutes = require("./routes/attractionsRoutes");
const settingsRoutes    = require("./routes/settingsRoutes");
const logger            = require("./middleware/logger");

// ---------------------------------------------------------------------------
// CORS – allow the React dev server (port 5173) to call this API
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-id");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(express.json());
app.use(logger);

// ---------------------------------------------------------------------------
// Route mounting – all under /api
// ---------------------------------------------------------------------------
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);
app.use("/api/attractions", attractionsRoutes);
app.use("/api/settings",    settingsRoutes);

// Health-check root
app.get("/", (req, res) => {
  res.json({ message: "TravelZ API is running", version: "2.0" });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(3000, () => {
  console.log("Backend running at http://localhost:3000");
  console.log("API base URL:       http://localhost:3000/api");
});
