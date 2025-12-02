import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "smart_cms",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional: test connection once
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to MySQL (promise pool)");
    connection.release();
  } catch (err) {
    console.error("MySQL connection error:", err);
  }
})();
