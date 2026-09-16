import fs from "node:fs";
import path from "node:path";

function stripQuotes(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = stripQuotes(match[2]);
  }
  return values;
}

// Runtime E2E scripts do not receive Next.js's .env loading automatically.
// Load local env files only for missing process variables; explicit shell env wins.
for (const file of [".env", ".env.local"]) {
  const values = readEnvFile(path.join(process.cwd(), file));
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// Normalize the two supported customer E2E credential conventions.
if (!process.env.READYSCORE_E2E_EMAIL && process.env.READYSCORE_AUTH_E2E_EMAIL) {
  process.env.READYSCORE_E2E_EMAIL = process.env.READYSCORE_AUTH_E2E_EMAIL;
}
if (!process.env.READYSCORE_E2E_PASSWORD && process.env.READYSCORE_AUTH_E2E_PASSWORD) {
  process.env.READYSCORE_E2E_PASSWORD = process.env.READYSCORE_AUTH_E2E_PASSWORD;
}

export function hasCustomerE2EAuth() {
  return Boolean(process.env.READYSCORE_SESSION_COOKIE?.trim() || (
    process.env.READYSCORE_E2E_EMAIL?.trim() && process.env.READYSCORE_E2E_PASSWORD
  ));
}

export function hasAdminE2EAuth() {
  return Boolean(
    (process.env.READYSCORE_ADMIN_E2E_EMAIL || process.env.ADMIN_EMAIL)?.trim() &&
    (process.env.READYSCORE_ADMIN_E2E_PASSWORD || process.env.ADMIN_PASSWORD)
  );
}
