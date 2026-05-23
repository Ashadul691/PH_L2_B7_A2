import type { Request, Response } from "express";
import { authService } from "./auth.service";

const registerUser = async (req: Request, res: Response) => {
  try {
    const data = await authService.registerUserIntoDB(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data,
    });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(400).json({ success: false, message: "Email already registered" });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const authController = { registerUser, loginUser };