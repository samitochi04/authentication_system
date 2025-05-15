import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middleware/auth.middleware";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com" // Replace with your production domain
        : "http://localhost:5173", // Vite's default development port
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Routes
app.use("/api/auth", authRoutes);

// Protected route example
app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user?.id,
  });
});

// Root route
app.get("/", (req, res) => {
  res.send("Authentication API is running");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});