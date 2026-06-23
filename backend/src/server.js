require("dotenv").config();
const http       = require("http");
const express    = require("express");
const { Server } = require("socket.io");

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin:  "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store the instance so controllers can call socketModule.emit()
const socketModule = require("./socket");
socketModule.init(io);

// Helper: broadcast current online state to all clients
function broadcastOnlineState() {
  const count = socketModule.getOnlineCount();
  const users = socketModule.getOnlineUsers();
  io.emit("onlineUsersUpdated", { onlineUsers: count, users });
}

io.on("connection", (socket) => {
  console.log(`[socket] client connected   → ${socket.id}`);

  // Authenticated clients announce themselves immediately after connecting
  socket.on("user:join", ({ userId, userName, role }) => {
    socketModule.addUser(socket.id, { userId, userName, role });
    broadcastOnlineState();

    // Notify admins that a user joined
    io.emit("user:joined", {
      userId,
      userName,
      role,
      time: new Date().toISOString(),
    });

    console.log(`[socket] ${userName} joined  → ${socketModule.getOnlineCount()} online`);
  });

  socket.on("disconnect", () => {
    const user = socketModule.getUser(socket.id);
    socketModule.removeUser(socket.id);
    broadcastOnlineState();

    if (user?.userName) {
      io.emit("user:left", {
        userId:   user.userId,
        userName: user.userName,
        role:     user.role,
        time:     new Date().toISOString(),
      });
      console.log(`[socket] ${user.userName} left  → ${socketModule.getOnlineCount()} online`);
    } else {
      console.log(`[socket] client disconnected → ${socket.id}`);
    }
  });
});

// ── Database + associations ────────────────────────────────────────────────
const sequelize = require("./config/database");
require("../models/associations");

// ── Routes ─────────────────────────────────────────────────────────────────
const authRoutes        = require("./routes/authRoutes");
const usersRoutes       = require("./routes/usersRoutes");
const attractionsRoutes = require("./routes/attractionsRoutes");
const settingsRoutes    = require("./routes/settingsRoutes");
const tripsRoutes       = require("./routes/tripsRoutes");
const interestsRoutes   = require("./routes/interestsRoutes");
const aiRoutes           = require("./routes/aiRoutes");
const onlineUsersRoutes  = require("./routes/onlineUsersRoutes");
const logger             = require("./middleware/logger");

// ── CORS ───────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin",  "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-role, x-user-id");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(logger);

// ── Route mounting ─────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);
app.use("/api/attractions", attractionsRoutes);
app.use("/api/settings",    settingsRoutes);
app.use("/api/trips",       tripsRoutes);
app.use("/api/interests",   interestsRoutes);
app.use("/api/ai",           aiRoutes);
app.use("/api/online-users", onlineUsersRoutes);

app.get("/", (req, res) => res.json({ message: "TravelZ API is running", version: "3.0" }));

// ── Start ──────────────────────────────────────────────────────────────────
sequelize.authenticate()
  .then(() => {
    console.log("MySQL connected via Sequelize");
    httpServer.listen(3000, () => {
      console.log("Backend  → http://localhost:3000");
      console.log("API      → http://localhost:3000/api");
      console.log("Socket   → ws://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    httpServer.listen(3000, () => {
      console.log("Backend running (no DB) → http://localhost:3000");
    });
  });
