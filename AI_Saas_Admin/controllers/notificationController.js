import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import {
  queries,
  createNotificationsTable,
} from "../config/sidebarnotiqueries.js";

// Create notifications table on startup if not exists
pool
  .query(createNotificationsTable)
  .catch((err) => console.error("Error creating notifications table:", err));

const JWT_SECRET = process.env.JWT_SECRET || "myjwtsecretkey";

export const createNotification = async (req, res) => {
  const client = await pool.connect();
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { message, is_read = false } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    await client.query("BEGIN");

    const result = await client.query(queries.createNotification, [
      decoded.user_id,
      message,
      is_read,
    ]);

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Notification created", notification: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error creating notification" });
  } finally {
    client.release();
  }
};

export const getNotifications = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const result = await pool.query(queries.getNotifications, [
      decoded.user_id,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error fetching notifications" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { id } = req.params;
    const result = await pool.query(queries.markNotificationAsRead, [
      id,
      decoded.user_id,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Notification not found or access denied" });
    }
    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error marking notification as read" });
  }
};
