import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.routes";
import { authenticate } from "./middleware/auth.middleware";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Configure CORS for both development and production
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*", 
    credentials: true, // Allow cookies to be sent with requests
  })
);

// API routes - defined before static files and catch-all
app.use("/api/auth", authRoutes);

// Protected route example
app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user?.id,
  });
});

// API health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// For production: serve static files and handle SPA routing
if (process.env.NODE_ENV === "production") {
  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, "..", "public")));
  
  // Handle SPA routing - IMPORTANT: This must come after API routes
  app.get("/*", (req, res, next) => {
    // Skip API routes - they should have been handled already
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    // Send the main index.html for all client-side routes
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});