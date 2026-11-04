
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load the main BodaLink .env file
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const app = express();
const port = Number(process.env.PORT || process.env.MOBILE_API_PORT || 3002);
const farePerKm = Number(process.env.FARE_PER_KM || 50);
if (process.env.NODE_ENV === "production") {
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_CA_CERT"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
}

// --------------------------------------------------
// DATABASE CONNECTION
// --------------------------------------------------

const localCaPath = path.join(__dirname, "../certificates/ca.pem");
const databaseCa = process.env.DB_CA_CERT || (fs.existsSync(localCaPath) ? fs.readFileSync(localCaPath, "utf8") : undefined);
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bodalink",
  port: Number(process.env.DB_PORT || 3306),
  ssl: process.env.DB_HOST ? { ca: databaseCa, rejectUnauthorized: true } : undefined
});

db.connect((err) => {
  if (err) {
    console.error("Mobile API MySQL connection failed:", err.message);
  } else {
    console.log("Mobile API connected to database.");
  }
});

// --------------------------------------------------
// DATABASE QUERY HELPER
// --------------------------------------------------

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }

      resolve(results);
    });
  });
}

// --------------------------------------------------
// TOKEN FUNCTIONS
// --------------------------------------------------

// Generate a secure login token
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Hash the token before storing it
function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

// Save the token hash in the database
async function createToken(userId) {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const expiry = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );

  const expiresAt = expiry
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await query(
    `INSERT INTO api_tokens
     (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt]
  );

  return token;
}

console.log("Token functions loaded:", {
  generateToken: typeof generateToken,
  hashToken: typeof hashToken,
  createToken: typeof createToken
});

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.CORS_ORIGIN || "*"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// Return safe user information without password details
const safeUser = (user) => ({
  id: user.id,
  phone: user.phone,
  profilePhoto: user.profile_photo || null
});

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

async function auth(req, res, next) {
  const authorization = req.get("authorization") || "";

  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({
      message: "Please log in to continue."
    });
  }

  try {
    const tokenHash = hashToken(token);

    const sessions = await query(
      `SELECT user_id
       FROM api_tokens
       WHERE token_hash = ?
       AND expires_at > NOW()`,
      [tokenHash]
    );

    if (!sessions.length) {
      return res.status(401).json({
        message: "Your session has expired. Please log in again."
      });
    }

    const users = await query(
      `SELECT id, phone, profile_photo
       FROM users
       WHERE id = ?`,
      [sessions[0].user_id]
    );

    if (!users.length) {
      return res.status(401).json({
        message: "Your session has expired. Please log in again."
      });
    }

    req.apiUser = users[0];
    req.apiTokenHash = tokenHash;

    next();

  } catch (err) {
    next(err);
  }
}

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  db.query("SELECT 1 FROM api_tokens LIMIT 1", (err) => {
    if (err) return res.status(503).json({ status: "unavailable", service: "BodaLink mobile API" });
    res.json({ status: "ok", service: "BodaLink mobile API", database: "connected" });
  });
});

// --------------------------------------------------
// SIGNUP
// --------------------------------------------------

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === "string"
      ? req.body.phone.trim()
      : "";

    const password = typeof req.body.password === "string"
      ? req.body.password
      : "";

    if (!phone || !password) {
      return res.status(400).json({
        message: "Enter your phone number and password."
      });
    }

    if (phone.length > 15) {
      return res.status(400).json({
        message: "Phone number must be 15 characters or fewer."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Use a password with at least 6 characters."
      });
    }

    const existing = await query(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (existing.length) {
      return res.status(409).json({
        message: "That phone number is already registered. Please log in."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users
       (phone, password, profile_photo)
       VALUES (?, ?, NULL)`,
      [phone, passwordHash]
    );

    const token = await createToken(result.insertId);

    const user = {
      id: result.insertId,
      phone,
      profile_photo: null
    };

    res.status(201).json({
      token,
      user: safeUser(user)
    });

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That phone number is already registered. Please log in."
      });
    }

    next(err);
  }
});

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const phone = typeof req.body.phone === "string"
      ? req.body.phone.trim()
      : "";

    const password = typeof req.body.password === "string"
      ? req.body.password
      : "";

    if (!phone || !password) {
      return res.status(400).json({
        message: "Enter your phone number and password."
      });
    }

    const users = await query(
      `SELECT id, phone, password, profile_photo
       FROM users
       WHERE phone = ?`,
      [phone]
    );

    if (
      !users.length ||
      !(await bcrypt.compare(password, users[0].password))
    ) {
      return res.status(401).json({
        message: "Invalid phone number or password."
      });
    }

    const token = await createToken(users[0].id);

    res.json({
      token,
      user: safeUser(users[0])
    });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

app.post("/api/auth/logout", auth, async (req, res, next) => {
  try {
    await query(
      "DELETE FROM api_tokens WHERE token_hash = ?",
      [req.apiTokenHash]
    );

    res.json({
      message: "You have been logged out."
    });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// USER PROFILE
// --------------------------------------------------

app.get("/api/profile", auth, (req, res) => {
  res.json({
    user: safeUser(req.apiUser)
  });
});

// --------------------------------------------------
// AVAILABLE RIDERS
// --------------------------------------------------

app.get("/api/riders", auth, async (req, res, next) => {
  try {
    const riders = await query(
      `SELECT id, name, stage, available
       FROM riders
       ORDER BY name`
    );

    res.json({ riders });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// USER TRIP HISTORY
// --------------------------------------------------

app.get("/api/trips", auth, async (req, res, next) => {
  try {
    const trips = await query(
      `SELECT
        t.id,
        t.pickup,
        t.destination,
        t.distance,
        t.fare,
        t.created_at,
        t.status,
        t.rider_id,
        r.name AS rider_name,
        r.stage
       FROM trips t
       JOIN riders r ON t.rider_id = r.id
       WHERE t.user_id = ?
       ORDER BY t.id DESC`,
      [req.apiUser.id]
    );

    const stats = await query(
      `SELECT
        COUNT(*) AS totalTrips,
        COALESCE(SUM(fare), 0) AS totalFare
       FROM trips
       WHERE user_id = ?`,
      [req.apiUser.id]
    );

    res.json({
      trips,
      stats: stats[0]
    });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// BOOK A RIDE
// --------------------------------------------------

app.post("/api/bookings", auth, async (req, res, next) => {
  try {
    const pickup = typeof req.body.pickup === "string"
      ? req.body.pickup.trim()
      : "";

    const destination = typeof req.body.destination === "string"
      ? req.body.destination.trim()
      : "";

    const distance = Number(req.body.distance);

    if (!pickup || !destination) {
      return res.status(400).json({
        message: "Enter both your pickup point and destination."
      });
    }

    if (pickup.length > 100 || destination.length > 100) {
      return res.status(400).json({
        message: "Locations must be 100 characters or fewer."
      });
    }

    if (
      !Number.isFinite(distance) ||
      distance <= 0 ||
      distance > 999
    ) {
      return res.status(400).json({
        message: "Enter a valid distance in kilometres."
      });
    }

    const riders = await query(
      `SELECT id, name, stage
       FROM riders
       WHERE available = TRUE
       LIMIT 1`
    );

    if (!riders.length) {
      return res.status(409).json({
        message: "No riders are available right now. Please try again shortly."
      });
    }

    const rider = riders[0];
    const fare = Math.round(distance * farePerKm * 100) / 100;

    const result = await query(
      `INSERT INTO trips
       (user_id, rider_id, pickup, destination, distance, fare, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.apiUser.id,
        rider.id,
        pickup,
        destination,
        distance,
        fare,
        "Pending"
      ]
    );

    await query(
      "UPDATE riders SET available = FALSE WHERE id = ?",
      [rider.id]
    );

    res.status(201).json({
      message: "Ride booked successfully.",
      trip: {
        id: result.insertId,
        pickup,
        destination,
        distance,
        fare,
        status: "Pending",
        rider_name: rider.name,
        stage: rider.stage
      }
    });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// COMPLETE A TRIP
// --------------------------------------------------

app.post("/api/trips/:id/complete", auth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        message: "Invalid trip ID."
      });
    }

    const trips = await query(
      `SELECT id, rider_id
       FROM trips
       WHERE id = ? AND user_id = ?`,
      [id, req.apiUser.id]
    );

    if (!trips.length) {
      return res.status(404).json({
        message: "We couldn't find that trip in your account."
      });
    }

    await query(
      `UPDATE trips
       SET status = 'Completed'
       WHERE id = ? AND user_id = ?`,
      [id, req.apiUser.id]
    );

    await query(
      "UPDATE riders SET available = TRUE WHERE id = ?",
      [trips[0].rider_id]
    );

    res.json({
      message: "Trip marked as completed."
    });

  } catch (err) {
    next(err);
  }
});

// --------------------------------------------------
// ERROR HANDLING
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error("Mobile API error:", err.stack || err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: "Something went wrong. Please try again."
  });
});

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(port, "0.0.0.0", () => {
  console.log(`BodaLink mobile API listening on port ${port}`);
});

