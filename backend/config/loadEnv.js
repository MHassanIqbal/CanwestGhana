import dotenv from "dotenv";
import path from "path";

process.env.NODE_ENV = (process.env.NODE_ENV || "development").toUpperCase();

// Only load .env file in non-production
if (process.env.NODE_ENV !== "PRODUCTION") {
  const envFile = ".env.development";
  const result = dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  if (result.error) {
    console.error(`❌ Error loading ${envFile}`, result.error);
    process.exit(1);
  } else {
    console.log(`✅ ${envFile} successfully loaded`);
  }
} else {
  console.log(
    "⚡ Production mode detected. Using environment variables from Render workplace.",
  );
}

// Validate required environment variables
const requiredEnvVars = [
  "DB_URI",
  "PORT",
  "SESSION_SECRET",
  "JWT_SECRET",
  "JWT_EXPIRES_TIME",
  "DEFAULT_ADMIN_EMAIL",
  "DEFAULT_ADMIN_PASSWORD",
  "FRONTEND_WORKPLACE_URL",
  "FRONTEND_ECOMMERCE_URL",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
