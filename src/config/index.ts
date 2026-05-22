import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  port:              process.env.PORT || 5000,
  connection_string: process.env.CONNECTIONSTRING as string,
  secret:            process.env.JWT_SECRET as string,
  refresh_secret:    process.env.JWT_REFRESH_SECRET as string,
};

export default config;