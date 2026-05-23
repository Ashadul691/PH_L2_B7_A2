import type { NextFunction, Request, Response } from "express";
import fs from "fs";

const logger = (req: Request, res: Response, next: NextFunction) => {
  const log = `${req.method} ${req.url} — ${new Date().toISOString()}`;
  console.log(log);
  fs.appendFile("logger.txt", `\n${log}\n`, () => {});
  next(); 
};

export default logger;