import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";

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




// setInterval(async () => {
//   try {

//     await axios.get(`${process.env.APPOINTMENT_URL}/health`);
//     await axios.get(`${process.env.USER_URL}/health`);
//     await axios.get(`${process.env.ADMIN_URL}/health`);
//     console.log("Health checks completed");
//   } catch (error) {
//     console.log("Health checks failed");
//     console.log(error.message);
//   }

// }, 60000);

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

      res.status(500).json({
        message: "Appointment service unavailable",
      });
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

      res.status(500).json({
        message: "User service unavailable",
      });
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

      res.status(500).json({
        message: "Admin service unavailable",
      });
    },
  })
);

const wakeUpServices = async () => {
  const services = [
    process.env.APPOINTMENT_URL,
    process.env.USER_URL,
    process.env.ADMIN_URL,
  ];

  await Promise.allSettled(
    services.map((service) =>
      axios.get(`${service}/health`, {
        timeout: 60000,
      })
    )
  );

  console.log("Wake-up requests sent");
};

const startServer = async () => {
  try {
    await wakeUpServices();
    setInterval(wakeUpServices, 60000);
  } catch (err) {
    console.error("Wake-up error:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Gateway running on port ${PORT}`);
  });
};

startServer();

