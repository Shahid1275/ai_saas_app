// config/queries.js
export const queries = {
  // Existing Queries (abbreviated for brevity)
  getTenantByName: "SELECT tenant_id FROM tenants WHERE name = $1",
  getTenantById: "SELECT tenant_id FROM tenants WHERE tenant_id = $1", // ✅ NEW
  createTenant: "INSERT INTO tenants (name) VALUES ($1) RETURNING tenant_id",
  getRoleByName: "SELECT role_id FROM roles WHERE name = $1",
  createUser: `
    INSERT INTO users (username, email, password_hash, role, tenant_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `,
  getUsers: "SELECT * FROM users",
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
  assignUserRole: "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
  createRefreshToken: `
    INSERT INTO refresh_tokens (user_id, token, expiry_date)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,
  getRefreshToken: "SELECT * FROM refresh_tokens WHERE token = $1",
  deleteRefreshToken: "DELETE FROM refresh_tokens WHERE token = $1",

  // Sidebar Configurations Queries
  createSidebarConfig: `
    INSERT INTO sidebar_configs (tenant_id, user_id, config_json)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,
  getSidebarConfigs: "SELECT * FROM sidebar_configs WHERE user_id = $1",
  updateSidebarConfig: `
    UPDATE sidebar_configs
    SET config_json = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE config_id = $2 AND user_id = $3
    RETURNING *;
  `,
  deleteSidebarConfig:
    "DELETE FROM sidebar_configs WHERE config_id = $1 AND user_id = $2 RETURNING *",

  // Notifications Queries
  createNotification: `
    INSERT INTO notifications (user_id, message, is_read)
    VALUES ($1, $2, $3)
    RETURNING *;
  `,
  getNotifications:
    "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
  markNotificationAsRead: `
    UPDATE notifications
    SET is_read = TRUE,
        updated_at = CURRENT_TIMESTAMP
    WHERE notification_id = $1 AND user_id = $2
    RETURNING *;
  `,
  deleteNotification:
    "DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING *",
};

// Ensure tables exist (add to existing createRefreshTokensTable if needed)
export const createSidebarConfigsTable = `
  CREATE TABLE IF NOT EXISTS sidebar_configs (
    config_id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(tenant_id),
    user_id INT REFERENCES users(user_id),
    config_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

export const createNotificationsTable = `
  CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
