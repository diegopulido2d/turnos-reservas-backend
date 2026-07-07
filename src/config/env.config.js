// src/config/env.config.js
import dotenv from "dotenv";
dotenv.config();

const requiredVars = ["PORT", "NODE_ENV"];
const missing = requiredVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error("❌ ERROR: Missing environment variables.");
  missing.forEach((v) => console.error(`   • ${v}`));
  process.exit(1);
}

const port = parseInt(process.env.PORT);
if (isNaN(port) || port <= 0 || port > 65535) {
  console.error(`❌ ERROR: Invalid PORT: "${process.env.PORT}"`);
  process.exit(1);
}

export default {
  port,
  nodeEnv: process.env.NODE_ENV,
};
