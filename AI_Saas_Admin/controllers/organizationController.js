import pool from "../config/db.js";

export const createOrganization = async (req, res) => {
  try {
    const { name, tenant_id, created_by } = req.body;
    const result = await pool.query(
      "INSERT INTO organizations (name, tenant_id, created_by) VALUES ($1, $2, $3) RETURNING *",
      [name, tenant_id, created_by]
    );
    res
      .status(201)
      .json({ message: "Organization created", organization: result.rows[0] });
  } catch (err) {
    console.error(err.stack);
    res
      .status(500)
      .json({ error: "every organization take specific tenat id" });
  }
};

export const getOrganizations = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM organizations");
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ error: "Error fetching organizations" });
  }
};
