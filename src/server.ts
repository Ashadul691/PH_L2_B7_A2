import app from "./app";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DevPulse running on http://localhost:${PORT}`);
});