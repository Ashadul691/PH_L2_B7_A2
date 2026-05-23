import cors from "cors";
import logger from "./middleware/logger";
import CookieParser from "cookie-parser";
import globalErrorHandler from "./middleware/globalErrorHandler";
import express, { type Application, type Request, type Response } from "express";
import { authRoute } from "./module/auth/auth.route";
import { issueRoute } from "./module/issue/issue.route";
import { metricsRoute } from "./module/metrics/metrics.route";




const app: Application = express();
app.use(CookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);                                   
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "DevPulse API is running" });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use("/api/metrics", metricsRoute);

app.use(globalErrorHandler);
export default app;