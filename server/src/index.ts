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

// Basic middleware
app.use(express.json());
app.use(cookieParser());

// Configure Helmet with relaxed CSP for SPA
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for simplicity in this example
  })
);

// Configure CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);

// API health check endpoint - place first for quick checks
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// API routes
app.use("/api/auth", authRoutes);

// Protected route example
app.get("/api/protected", authenticate, (req, res) => {
  res.json({
    message: "This is a protected route",
    userId: req.user?.id,
  });
});

// Production static file serving and SPA handling
if (process.env.NODE_ENV === "production") {
  console.log("Serving static files from:", path.join(__dirname, "..", "public"));
  
  // Static files
  app.use(express.static(path.join(__dirname, "..", "public")));
  
  // SPA route handling - must be after API routes
  // Use a simple approach to minimize chances of path parsing errors
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
  
  app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
  
  app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
  
  app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
  
  // Fallback for other client routes - use a simpler approach than before
  app.use((req, res, next) => {
    // Skip API routes and static files that should have been handled already
    if (req.url.startsWith("/api/") || req.method !== "GET") {
      return next();
    }
    
    // Serve index.html for client routes
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });
}

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});