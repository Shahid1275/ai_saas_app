import express from "express";
import http from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";
import "dotenv/config";

import tenatRouter from "./routes/tenantRoutes.js";
import userRouter from "./routes/userRoutes.js";
import Orgrouter from "./routes/organizationRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";
import sidebarRouter from "./routes/sidebarRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server for both Express and Socket.IO
const server = http.createServer(app);

// Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: "*", // For dev: allow all; change for prod
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

// Attach io instance to all requests so routes can use it
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database connection test
pool.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
  } else {
    console.log("Database connection successful");
  }
});

// Test database connection endpoint
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database connected", time: result.rows[0].now });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Routes
app.use("/", tenatRouter);
app.use("/", userRouter);
app.use("/", Orgrouter);
app.use("/", sidebarRouter);
app.use("/", notificationRouter);

// WebSocket events
io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server with Socket.IO support
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
