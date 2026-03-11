import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB
connectDB();

// Health check
app.get("/", (req, res) => {
  res.json({ success: true, message: "Admin Backend Running" });
});

// Routes (will wire later)
import authRoutes from "./routes/authRoute.js";

import accessRoutes from "./routes/accessRoute.js";
import roleRoutes from "./routes/roleRoute.js";
import schoolRoutes from "./routes/schoolRoute.js";
import subscriptionRoutes from "./routes/subscriptionRoute.js";

import studentRoutes from "./routes/studentRoute.js";
import teacherRoutes from "./routes/teacherRoute.js";


app.use("/api/auth", authRoutes);

app.use("/api/access", accessRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/schools", schoolRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.use("/api/students",studentRoutes);
app.use("/api/teachers",teacherRoutes);

// Error middleware
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
