// config/queries.js
export const queries = {
  // Tenant Queries
  getTenantByName: "SELECT tenant_id FROM tenants WHERE name = $1",
  createTenant: "INSERT INTO tenants (name) VALUES ($1) RETURNING tenant_id",

  // Role Queries
  getRoleByName: "SELECT role_id FROM roles WHERE name = $1",

  // User Queries
  createUser: `
    INSERT INTO users (username, email, password_hash, role, tenant_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `,
  getUsers: "SELECT * FROM users",
  getUserByEmail: "SELECT * FROM users WHERE email = $1", // <-- NEW QUERY
  getUserById: "SELECT * FROM users WHERE user_id = $1",
  updateUser: `
    UPDATE users
    SET username = COALESCE($1, username),
        email = COALESCE($2, email),
        role = COALESCE($3, role),
        tenant_id = COALESCE($4, tenant_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $5
    RETURNING *;
  `,
  deleteUser: "DELETE FROM users WHERE user_id = $1 RETURNING *",

  // User-Role Mapping
  assignUserRole: "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",

  // Refresh Token (new table for refresh tokens)
  createRefreshToken: `
    INSERT INTO refresh_tokens (user_id, token, expiry_date)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,
  getRefreshToken: "SELECT * FROM refresh_tokens WHERE token = $1",
  deleteRefreshToken: "DELETE FROM refresh_tokens WHERE token = $1",
};

// Add refresh_tokens table to schema if not exists
export const createRefreshTokensTable = `
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    token VARCHAR(500) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
