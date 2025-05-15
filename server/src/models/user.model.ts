import db from "../db";
import bcrypt from "bcrypt";

export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
}

export class UserModel {
  static async findByEmail(email: string): Promise<UserWithPassword | null> {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  static async create(
    email: string,
    password: string,
    fullName: string
  ): Promise<User> {
    try {
      // Hash password with bcrypt (10 rounds)
      const passwordHash = await bcrypt.hash(password, 10);

      const result = await db.query(
        "INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, created_at, updated_at",
        [email, passwordHash, fullName]
      );

      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async comparePassword(
    plainText: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}