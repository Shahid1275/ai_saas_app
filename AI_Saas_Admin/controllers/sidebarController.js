import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import "dotenv/config";
import {
  queries,
  createSidebarConfigsTable,
} from "../config/sidebarnotiqueries.js";

// Ensure sidebar_configs table exists on startup
pool
  .query(createSidebarConfigsTable)
  .catch((err) => console.error("Error creating sidebar_configs table:", err));

const JWT_SECRET = process.env.JWT_SECRET || "myjwtsecretkey";

export const createSidebarConfig = async (req, res) => {
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

    const { tenant_id, config_json } = req.body;
    if (!tenant_id || !config_json) {
      return res
        .status(400)
        .json({ error: "tenant_id and config_json are required" });
    }

    await client.query("BEGIN");

    // FIX: look up by tenant_id instead of name
    const tenantCheck = await client.query(
      "SELECT tenant_id FROM tenants WHERE tenant_id = $1",
      [tenant_id]
    );

    if (tenantCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Tenant not found" });
    }

    const result = await client.query(queries.createSidebarConfig, [
      tenant_id,
      decoded.user_id,
      JSON.stringify(config_json),
    ]);

    await client.query("COMMIT");

    res
      .status(201)
      .json({ message: "Sidebar config created", sidebar: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error creating sidebar config" });
  } finally {
    client.release();
  }
};

export const getSidebarConfigs = async (req, res) => {
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

    const result = await pool.query(queries.getSidebarConfigs, [
      decoded.user_id,
    ]);

    res.json(
      result.rows.map((row) => ({
        ...row,
        config_json: JSON.parse(row.config_json),
      }))
    );
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error fetching sidebar configs" });
  }
};
