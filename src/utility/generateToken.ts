import jwt from "jsonwebtoken";
import config from "../config";

export interface IJwtPayload {
  id:   number;
  name: string;
  role: string;
}
export const generateToken = (payload: IJwtPayload): string => {
  return jwt.sign(payload, config.secret, { expiresIn: "1d" });
};