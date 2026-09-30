import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// ======================================================
// Middleware
// ======================================================

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
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ======================================================
// Health Check
// ======================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "API Gateway",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// Wake Up / Heartbeat Service
// ======================================================

const wakeUpServices = async () => {
  const services = {
    appointmentService: process.env.APPOINTMENT_URL,
    userService: process.env.USER_URL,
    adminService: process.env.ADMIN_URL,
  };

  const results = await Promise.allSettled(
    Object.entries(services).map(async ([name, url]) => {
      if (!url) {
        return {
          service: name,
          status: "failed",
          message: "Service URL is not configured",
        };
      }

      try {
        const response = await axios.get(`${url}/health`, {
          timeout: 60000,
        });

        return {
          service: name,
          status: "ok",
          statusCode: response.status,
          message: "Heartbeat successful",
        };
      } catch (error) {
        return {
          service: name,
          status: "failed",
          statusCode: error.response?.status || null,
          message: error.message,
        };
      }
    })
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      service: "unknown",
      status: "failed",
      message: result.reason?.message || "Unknown error",
    };
  });
};

// Wake up all services endpoint
app.get("/wakeup", async (req, res) => {
  console.log("Sending heartbeat to all services...");

  try {
    const results = await wakeUpServices();

    const hasFailure = results.some(
      (service) => service.status === "failed"
    );

    res.status(hasFailure ? 503 : 200).json({
      success: !hasFailure,
      message: hasFailure
        ? "Some services failed to respond"
        : "All services are alive",
      timestamp: new Date().toISOString(),
      services: results,
    });
  } catch (error) {
    console.error("Wake-up error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to send heartbeat requests",
      error: error.message,
    });
  }
});

// ======================================================
// Appointment Service
// ======================================================

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

      res.status(500).json({
        message: "Appointment service unavailable",
      });
    },
  })
);

// ======================================================
// User Service
// ======================================================

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

      res.status(500).json({
        message: "User service unavailable",
      });
    },
  })
);

// ======================================================
// Admin Service
// ======================================================

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

      res.status(500).json({
        message: "Admin service unavailable",
      });
    },
  })
);

// ======================================================
// Start Server
// ======================================================

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
  });
};

startServer();

