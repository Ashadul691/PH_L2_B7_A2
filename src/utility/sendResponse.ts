import type { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success:    boolean;
  message:    string;
  data?:      T;
  errors?:    unknown;
};

const sendResponse = <T>(res: Response, payload: TResponse<T>): void => {
  const body: Record<string, unknown> = {
    success: payload.success,
    message: payload.message,
  };
 
  if (payload.data !== undefined)   body.data   = payload.data;
  if (payload.errors !== undefined) body.errors = payload.errors;
 
  res.status(payload.statusCode).json(body);
};
 
export default sendResponse;