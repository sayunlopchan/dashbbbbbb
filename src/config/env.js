const dotenv = require("dotenv");
const path = require("path");

const loadEnv = () => {
  dotenv.config({ path: path.join(__dirname, "../../.env") });

  const required = [
    "PORT",
    "MONGO_URI",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_SECURE",
    "EMAIL_USER",
    "EMAIL_PASS",
    "CRON_DAILY_SCHEDULE",
  ];

  required.forEach((key) => {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  });
};

module.exports = { loadEnv };
