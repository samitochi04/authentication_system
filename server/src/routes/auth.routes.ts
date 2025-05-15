import { Router, Request, Response } from "express";
import { AuthController } from "../controllers/auth.controller";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validation.middleware";

const router = Router();

// Registration route
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter"),
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    validateRequest,
  ],
  (req: Request, res: Response): void => {
    AuthController.register(req, res);
  }
);

// Login route
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validateRequest,
  ],
  (req: Request, res: Response): void => {
    AuthController.login(req, res);
  }
);

// Refresh token route
router.post("/refresh-token", (req: Request, res: Response): void => {
  AuthController.refreshToken(req, res);
});

// Logout route
router.post("/logout", (req: Request, res: Response): void => {
  AuthController.logout(req, res);
});

export default router;