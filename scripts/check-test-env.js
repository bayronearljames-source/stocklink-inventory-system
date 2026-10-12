const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const root = path.resolve(__dirname, "..");
const appEnvPath = path.join(root, ".env");
const testEnvPath = path.join(root, ".env.test");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return dotenv.parse(fs.readFileSync(filePath));
}

function databaseIdentity(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  // Supabase direct URLs include the project ref in the hostname. Pooler URLs
  // include it in the username (for example, postgres.<project-ref>).
  const directProject = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i)?.[1];
  const poolerSuffix = decodeURIComponent(url.username).split(".").at(-1);
  const poolerProject = /^[a-z0-9]{20}$/i.test(poolerSuffix) ? poolerSuffix : null;
  const projectRef = directProject || (url.hostname.endsWith("pooler.supabase.com") ? poolerProject : null);

  if (projectRef) return `supabase:${projectRef.toLowerCase()}`;
  return `${url.hostname.toLowerCase()}:${url.port || "5432"}/${url.pathname}/${decodeURIComponent(url.username)}`;
}

function validateTestEnvironment() {
  const testEnv = readEnvFile(testEnvPath);
  if (!testEnv) {
    throw new Error("Missing .env.test. Create it with the separate disposable test project's connection settings.");
  }
  if (testEnv.DB_ENVIRONMENT !== "test") {
    throw new Error("Set DB_ENVIRONMENT=test in .env.test before running database tests.");
  }
  if (!testEnv.DATABASE_URL) {
    throw new Error(".env.test must define DATABASE_URL for the disposable test database.");
  }

  const appEnv = readEnvFile(appEnvPath);
  if (!appEnv?.DATABASE_URL) {
    throw new Error("Cannot verify test database isolation: root .env with DATABASE_URL is missing.");
  }

  if (databaseIdentity(testEnv.DATABASE_URL) === databaseIdentity(appEnv.DATABASE_URL)) {
    throw new Error("Refusing to run tests: .env.test points to the same database project as root .env.");
  }
}

if (require.main === module) {
  try {
    validateTestEnvironment();
    console.log("Test database configuration is present and separate from root .env.");
  } catch (error) {
    console.error(`Test database safety check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

// Jest's CommonJS globalSetup expects the module itself to export a function.
// Keep the named property as well because testSetup.js imports the validator.
module.exports = async function globalSetup() {
  validateTestEnvironment();
};
module.exports.validateTestEnvironment = validateTestEnvironment;
