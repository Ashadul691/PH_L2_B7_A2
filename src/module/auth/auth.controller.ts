import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { registerUserIntoDB, loginUserIntoDB } from "./auth.service";
import type { IRegister, ILogin } from "./auth.interface";

const registerUser = async (req: Request, res: Response) => {
  try {
    const data = req.body as IRegister;
    
    const result = await registerUserIntoDB(data);
    sendResponse(res, { statusCode: 201, success: true, message: "User registered successfully", data: result });
  } catch (error: any) {
    if (error.message.includes("duplicate key")) {
      sendResponse(res, { statusCode: 400, success: false, message: "Email already registered" });
    } else {
      sendResponse(res, { statusCode: 401, success: false, message: error.message });
    }
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    const data = req.body as ILogin;
    const result = await loginUserIntoDB(data);
    sendResponse(res, { statusCode: 200, success: true, message: "Login successful", data: result });
  } catch (error: any) {
    sendResponse(res, { statusCode: 401, success: false, message: error.message });
  }
};

export const authController = {
  registerUser,
  loginUser,
};