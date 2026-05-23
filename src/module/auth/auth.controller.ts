import type { NextFunction, Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { registerUserIntoDB, loginUserIntoDB } from "./auth.service";
import type { IRegister, ILogin } from "./auth.interface";

const registerUser = async (req: Request, res: Response, next: NextFunction) =>  {
  try {
    const data = req.body as IRegister;
// validate required fields
    if (!data.name || !data.email || !data.password) {
      sendResponse(res, {
        statusCode: 400,
        success:    false,
        message:    "Validation error",
        errors:     "name, email, and password are required",
      });
      return;
    }
//vlidate email formate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      sendResponse(res, { statusCode: 400, success: false, message: "Invalid email format" });
      return;
    }
// validate role if provided
    if (data.role && !["contributor", "maintainer"].includes(data.role)) {
      sendResponse(res, {
        statusCode: 400,
        success:    false,
        message:    "Invalid role — must be contributor or maintainer",
      });
      return;
    }
 
    const result = await registerUserIntoDB(data);
    sendResponse(res, {
      statusCode: 201,
      success:    true,
      message:    "User registered successfully",
      data:       result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.includes("duplicate key")) {
      sendResponse(res, { statusCode: 400, success: false, message: "Email already registered" });
    } else {
      next(error);
    }
  }
};
 
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body as ILogin;
 
    if (!data.email || !data.password) {
      sendResponse(res, {
        statusCode: 400,
        success:    false,
        message:    "email and password are required",
      });
      return;
    }
 
    const result = await loginUserIntoDB(data);
    sendResponse(res, { statusCode: 200, success: true, message: "Login successful", data: result });
  } catch (error: unknown) {
    const err = error as Error;
    sendResponse(res, { statusCode: 401, success: false, message: err.message });
  }
};

export const authController = {
  registerUser,
  loginUser,
};