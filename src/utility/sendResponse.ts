import type { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success:    boolean;
  message:    string;
  data?:      T;
  errors?:    any;
};

const sendResponse = <T>(res: Response, payload: TResponse<T>): void => {
  res.status(payload.statusCode).json({
    success: payload.success,
    message: payload.message,
    data:    payload.data,
    errors:  payload.errors,
  });
};

export default sendResponse;