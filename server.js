const http = require("http");
const app = require("./src/app");
const { loadEnv } = require("./src/config/env");
const { connectDB } = require("./src/config/db");
const { startAllCronJobs } = require("./src/cron");

loadEnv();
connectDB();

const server = http.createServer(app);

startAllCronJobs();



const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
