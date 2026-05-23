import express, { type Application, type Request, type Response } from "express";
import { authRoute } from "./module/auth/auth.route";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "DevPulse API is running" });
});

app.use("/api/auth", authRoute);
export default app;