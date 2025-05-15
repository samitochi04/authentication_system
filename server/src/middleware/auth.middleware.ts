import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
}

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key_here"
    ) as JwtPayload;

    // Attach the user ID to the request object
    req.user = { id: decoded.userId };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired" });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
    return;
  }
};