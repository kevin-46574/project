// server.js
const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// INITIALIZE DATABASE TABLE
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(50) DEFAULT 'Low',
        due_date DATE,
        category VARCHAR(100) DEFAULT 'General',
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(" Tasks table created/verified");
  } catch (err) {
    console.error(" Error creating table:", err.message);
  }
})();


// TEST ROUTES

app.get("/", (req, res) => res.send("NeoGen Task API is running..."));

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    console.error("DB test failed:", err.message);
    res.status(500).json({ error: "DB connection failed", details: err.message });
  }
});


// TASK ROUTES

app.get("/api/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, priority, due_date, category, completed } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, due_date, category, completed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        title,
        description || "",
        priority?.trim() || "Low",
        due_date || null,
        category?.trim() || "General",
        completed ?? false,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating task:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, due_date, completed, category } = req.body;

    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Task not found" });

    const task = existing.rows[0];

    const updatedTask = await pool.query(
      `UPDATE tasks
       SET title=$1, description=$2, priority=$3, due_date=$4, completed=$5, category=$6, updated_at=CURRENT_TIMESTAMP
       WHERE id=$7
       RETURNING *`,
      [
        title ?? task.title,
        description ?? task.description,
        priority ?? task.priority,
        due_date ?? task.due_date,
        completed ?? task.completed,
        category ?? task.category,
        id,
      ]
    );

    res.json(updatedTask.rows[0]);
  } catch (err) {
    console.error("Error updating task:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);

    if (!result.rows.length) return res.status(404).json({ error: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


// START SERVER

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});