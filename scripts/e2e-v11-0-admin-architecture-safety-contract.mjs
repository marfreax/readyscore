import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "architecture/phase-11.0/ReadyScore_V11_0_Admin_Architecture_Safety_Contract.md",
  "lib/admin/v11-safety-contract.ts",
  "V11_0_DELIVERY_MANIFEST.json",
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error(`FAIL: runtime-contract artifact missing: ${file}`);
    process.exit(1);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "V11_0_DELIVERY_MANIFEST.json"), "utf8"));
if (manifest.databaseMigration !== false) {
  console.error("FAIL: V11.0 runtime contract declares a database migration");
  process.exit(1);
}

console.log("V11.0 architecture contract runtime smoke: PASS");
console.log("No customer runtime behavior is claimed to change in V11.0.");
