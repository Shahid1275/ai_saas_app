import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { queries, createRefreshTokensTable } from "../config/Userqueries.js";

// Create refresh_tokens table on startup if not exists
pool
  .query(createRefreshTokensTable)
  .catch((err) => console.error("Error creating refresh_tokens table:", err));

// Constants
const JWT_SECRET = process.env.JWT_SECRET || "myjwtsecretkey";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "myrefreshsecretkey"; // Separate secret for refresh tokens

// Create User
export const createUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, email, password, role, tenant_name } = req.body;

    // Input validation
    if (!username || !email || !password || !role || !tenant_name) {
      return res.status(400).json({
        error:
          "All fields (username, email, password, role, tenant_name) are required",
      });
    }

    // Transaction to ensure consistency
    await client.query("BEGIN");

    // Handle tenant creation or retrieval
    let tenant_id;
    const tenantCheck = await client.query(queries.getTenantByName, [
      tenant_name,
    ]);
    if (tenantCheck.rows.length > 0) {
      tenant_id = tenantCheck.rows[0].tenant_id;
    } else {
      const tenantResult = await client.query(queries.createTenant, [
        tenant_name,
      ]);
      tenant_id = tenantResult.rows[0].tenant_id;
    }

    // Look up role_id from roles table
    const roleResult = await client.query(queries.getRoleByName, [role]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Role not found" });
    }
    const role_id = roleResult.rows[0].role_id;

    // Hash the password
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: "Password must be a string and at least 8 characters long",
      });
    }
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const userResult = await client.query(queries.createUser, [
      username,
      email,
      password_hash,
      role,
      tenant_id,
    ]);

    // Assign role to user
    await client.query(queries.assignUserRole, [
      userResult.rows[0].user_id,
      role_id,
    ]);

    // Generate JWT and refresh token
    const accessToken = jwt.sign(
      { user_id: userResult.rows[0].user_id, role },
      JWT_SECRET,
      { expiresIn: "15m" } // Short-lived access token
    );
    const refreshToken = jwt.sign(
      { user_id: userResult.rows[0].user_id },
      REFRESH_SECRET,
      { expiresIn: "7d" } // Longer-lived refresh token
    );

    // Store refresh token in database
    await client.query(queries.createRefreshToken, [
      userResult.rows[0].user_id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "User created successfully",
      user: userResult.rows[0],
      accessToken,
      refreshToken,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.stack);
    res.status(500).json({ error: "Error creating user" });
  } finally {
    client.release();
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if refresh token exists in database
    const tokenResult = await pool.query(queries.getRefreshToken, [
      refreshToken,
    ]);
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Generate new access token
    const userResult = await pool.query(queries.getUserById, [decoded.user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = userResult.rows[0];
    const newAccessToken = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }
    res.status(500).json({ error: "Error refreshing token" });
  }
};

// Get Users
export const getUsers = async (req, res) => {
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

    const result = await pool.query(queries.getUsers);
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error fetching users" });
  }
};

// Get User by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET);

    const result = await pool.query(queries.getUserById, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error fetching user" });
  }
};

// Update User
export const updateUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { username, email, role, tenant_name } = req.body;
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    await client.query("BEGIN");

    let tenant_id;
    if (tenant_name) {
      const tenantCheck = await client.query(queries.getTenantByName, [
        tenant_name,
      ]);
      if (tenantCheck.rows.length > 0) {
        tenant_id = tenantCheck.rows[0].tenant_id;
      } else {
        const tenantResult = await client.query(queries.createTenant, [
          tenant_name,
        ]);
        tenant_id = tenantResult.rows[0].tenant_id;
      }
    }

    const result = await client.query(queries.updateUser, [
      username,
      email,
      role,
      tenant_id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    await client.query("COMMIT");

    res.json({ message: "User updated successfully", user: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error updating user" });
  } finally {
    client.release();
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.user_id) {
      return res.status(401).json({ error: "Invalid token" });
    }

    await client.query("BEGIN");

    const result = await client.query(queries.deleteUser, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]); // Clean up roles
    await client.query("DELETE FROM refresh_tokens WHERE user_id = $1", [id]); // Clean up refresh tokens
    await client.query("COMMIT");

    res.json({ message: "User deleted successfully", user: result.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.stack);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    res.status(500).json({ error: "Error deleting user" });
  } finally {
    client.release();
  }
};
// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    // Remove token from DB
    const result = await pool.query(queries.deleteRefreshToken, [refreshToken]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Refresh token not found or already removed" });
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error logging out" });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const userResult = await pool.query(queries.getUserByEmail, [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign({ user_id: user.user_id }, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Save refresh token in DB
    await pool.query(queries.createRefreshToken, [
      user.user_id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ]);

    res.json({
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error logging in" });
  }
};
