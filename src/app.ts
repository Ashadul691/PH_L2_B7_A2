import express, { type Application, type Request, type Response } from "express";
import { authRoute } from "./module/auth/auth.route";
import { issueRoute } from "./module/issue/issue.route";

const app: Application = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "DevPulse API is running" });
});

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
export default app;