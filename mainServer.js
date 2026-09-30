
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// Log every request
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.DASHBOARD_URL,
    process.env.FRONTEND_URL_PORT,
    process.env.DASHBOARD_URL_PORT,
  ].filter(Boolean),

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  credentials: true,
};

app.use(cors(corsOptions));

// Gateway health check
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Appointment Service
app.use(
  "/api/v1/appointmentService",
  createProxyMiddleware({
    target: process.env.APPOINTMENT_URL,
    changeOrigin: true,

    pathRewrite: {
      "^/api/v1/appointmentService": "",
    },

    onError: (err, req, res) => {
      console.error("Appointment Service Error:", err.message);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Appointment service unavailable",
        });
      }
    },
  })
);

// User Service
app.use(
  "/api/v1/userService",
  createProxyMiddleware({
    target: process.env.USER_URL,
    changeOrigin: true,

    pathRewrite: {
      "^/api/v1/userService": "",
    },

    onError: (err, req, res) => {
      console.error("User Service Error:", err.message);

      if (!res.headersSent) {
        res.status(500).json({
          message: "User service unavailable",
        });
      }
    },
  })
);

// Admin Service
app.use(
  "/api/v1/adminService",
  createProxyMiddleware({
    target: process.env.ADMIN_URL,
    changeOrigin: true,

    pathRewrite: {
      "^/api/v1/adminService": "",
    },

    onError: (err, req, res) => {
      console.error("Admin Service Error:", err.message);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Admin service unavailable",
        });
      }
    },
  })
);

// Start server
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
  console.log(`Appointment Service: ${process.env.APPOINTMENT_URL}`);
  console.log(`User Service: ${process.env.USER_URL}`);
  console.log(`Admin Service: ${process.env.ADMIN_URL}`);
});

