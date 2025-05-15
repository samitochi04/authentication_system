import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import db from "../db";
import { v4 as uuidv4 } from "uuid";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, fullName } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: "User with this email already exists" });
        return;
      }

      // Create new user
      const user = await UserModel.create(email, password, fullName);

      // Generate tokens
      const { accessToken, refreshToken } = await AuthController.generateTokens(
        user.id
      );

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      });

      res.status(201).json({
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        accessToken,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Compare password
      const isPasswordValid = await UserModel.comparePassword(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = await AuthController.generateTokens(
        user.id
      );

      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      });

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
        accessToken,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token not found" });
        return;
      }

      // Verify token from database
      const tokenResult = await db.query(
        "SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1",
        [refreshToken]
      );

      if (tokenResult.rows.length === 0) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }

      const { user_id, expires_at } = tokenResult.rows[0];

      // Check if token is expired
      if (new Date() > new Date(expires_at)) {
        await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
          refreshToken,
        ]);
        res.status(401).json({ message: "Refresh token expired" });
        return;
      }

      // Generate new tokens
      const tokens = await AuthController.generateTokens(user_id);

      // Remove old refresh token
      await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
        refreshToken,
      ]);

      // Set new refresh token in cookie
      res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "strict",
      });

      res.json({
        message: "Token refreshed successfully",
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
        // Delete refresh token from database
        await db.query("DELETE FROM refresh_tokens WHERE token = $1", [
          refreshToken,
        ]);
      }

      // Clear the cookie
      res.clearCookie("refreshToken");

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  private static async generateTokens(
    userId: number
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token using direct string values to avoid type issues
    const secret = process.env.JWT_SECRET || "your_jwt_secret_key_here";
    const expiry = process.env.JWT_EXPIRY || "15m";
    
    // Use a different approach to call jwt.sign that works with TypeScript
    let accessToken: string;
    try {
      // Type assertion to avoid TypeScript errors with jwt.sign
      accessToken = jwt.sign({ userId }, secret, {
        expiresIn: expiry
      } as jwt.SignOptions);
    } catch (error) {
      console.error("Error signing JWT:", error);
      throw new Error("Failed to generate access token");
    }

    // Generate refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Store refresh token in database
    await db.query(
      "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [refreshToken, userId, expiresAt]
    );

    return { accessToken, refreshToken };
  }
}