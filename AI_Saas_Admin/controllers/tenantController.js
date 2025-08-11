import pool from "../config/db.js";

export const createTenant = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      "INSERT INTO tenants (name) VALUES ($1) RETURNING *",
      [name]
    );
    res.status(201).json({ message: "Tenant created", tenant: result.rows[0] });
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error creating tenant" });
  }
};

export const getTenants = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tenants");
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error fetching tenants" });
  }
};
