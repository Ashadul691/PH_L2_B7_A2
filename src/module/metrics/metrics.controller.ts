import type { NextFunction, Request, Response } from "express";
import sendResponse from "../../utility/sendResponse";
import { metricsService } from "./metrics.service";
 
const getMetrics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await metricsService.getSystemMetrics();
    sendResponse(res, { statusCode: 200, success: true, message: "Metrics retrieved successfully", data });
  } catch (error) {
    next(error);
  }
};
 
export const metricsController = { getMetrics };