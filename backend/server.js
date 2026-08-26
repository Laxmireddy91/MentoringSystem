import "dotenv/config";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "MentorConnect API is running",
    database: "MentoringSystem",
  });
});

/* =========================================================
   ROUTES
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/workspace",
  workspaceRoutes
);

app.use(
  "/api/risk",
  riskRoutes
);

/* =========================================================
   404
========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(
    "❌ SERVER ERROR:",
    err
  );

  res.status(500).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `🚀 API running on http://localhost:${PORT}`
      );

      console.log(
        `❤️ Health: http://localhost:${PORT}/api/health`
      );
    });
  } catch (error) {
    console.error(
      "❌ Server startup failed:",
      error
    );

    process.exit(1);
  }
}

startServer();