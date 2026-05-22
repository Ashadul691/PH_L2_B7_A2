import app from "./app";
import config from "./config";
import { initDB } from "./db";

const main = async () => {
  await initDB();                 
  app.listen(config.port, () => {
    console.log(`DevPulse running on http://localhost:${config.port}`);
  });
};

main();