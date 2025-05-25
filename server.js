import http from "http";
import app from "./src/app.js";
import { loadEnv } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { startAllCronJobs } from "./src/cron/index.js";

loadEnv();
connectDB();

const server = http.createServer(app);

startAllCronJobs();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
