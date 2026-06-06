import express from "express"
import expressProxy from "express-http-proxy"
import dotenv from "dotenv";
import cors from "cors"; 
dotenv.config();
const PORT=process.env.PORT||5000;


 const app=express();


  // Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next(); // important to pass control to next middleware/route
});


 console.log(process.env.FRONTEND_URL);
console.log(process.env.DASHBOARD_URL);
 const corsOptions = {
   origin: [
     process.env.FRONTEND_URL,
     process.env.DASHBOARD_URL,
     process.env.FRONTEND_URL_PORT,
     process.env.DASHBOARD_URL_PORT
   ],
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
   credentials: true
 };
 
 app.use(cors(corsOptions));

 app.get("/health", (req, res) => {
  res.status(200).send("OK");
});











// Appointment Service routes
app.use("/api/v1/appointmentService", expressProxy(process.env.APPOINTMENT_URL,{
    proxyErrorHandler(err,res,next){
          res.status(500).json({ message: "Appointment service unavailable" });
    }
}));


// User Service routes
app.use("/api/v1/userService", expressProxy(process.env.USER_URL,{
    proxyErrorHandler(err,res,next){
          res.status(500).json({ message: "User service unavailable" });
    }
}));

app.use("/api/v1/adminService", expressProxy(process.env.ADMIN_URL,{
    proxyErrorHandler(err,res,next){
          res.status(500).json({ message: "Admin service unavailable" });
    }
}));


 app.listen(PORT,()=>{
    console.log(`Gateway is running on port ${PORT}`);
 })