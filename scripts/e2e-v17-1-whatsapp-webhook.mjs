import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";

const port = 3187;
const baseUrl = `http://127.0.0.1:${port}`;
const verifyToken = "readyscore-v17-1-local-verify";
const appSecret = "readyscore-v17-1-local-app-secret";

function sign(body) {
  return `sha256=${createHmac("sha256", appSecret).update(Buffer.from(body)).digest("hex")}`;
}

function waitForServer(child, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let output = "";
    const onData = (chunk) => {
      output += chunk.toString();
      if (output.includes("Ready in") || output.includes("started server") || output.includes("Local:")) {
        cleanup();
        resolve();
      }
    };
    const onExit = (code) => {
      cleanup();
      reject(new Error(`Next server exited before readiness (code=${code})\n${output}`));
    };
    const timer = setInterval(() => {
      if (Date.now() - started > timeoutMs) {
        cleanup();
        reject(new Error(`Timed out waiting for Next server\n${output}`));
      }
    }, 200);
    const cleanup = () => {
      clearInterval(timer);
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
      child.off("exit", onExit);
    };
    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
    child.on("exit", onExit);
  });
}

async function get(path) {
  return fetch(`${baseUrl}${path}`);
}

async function post(body, signature) {
  return fetch(`${baseUrl}/api/webhooks/whatsapp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
    },
    body,
  });
}

const child = spawn("pnpm", ["exec", "next", "start", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    WHATSAPP_VERIFY_TOKEN: verifyToken,
    WHATSAPP_APP_SECRET: appSecret,
    READYSCORE_WHATSAPP_PERSISTENCE_ENABLED: "false",
  },
});

try {
  await waitForServer(child);

  const verified = await get(
    `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=readyscore-v17-1-challenge`,
  );
  const verifiedBody = await verified.text();
  if (verified.status !== 200 || verifiedBody !== "readyscore-v17-1-challenge") {
    throw new Error(`verification failed: status=${verified.status} body=${verifiedBody}`);
  }

  const rejectedVerification = await get(
    `/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=x`,
  );
  if (rejectedVerification.status !== 403) {
    throw new Error(`invalid verification expected 403, got ${rejectedVerification.status}`);
  }

  const sample = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{
      id: "1394892188831173",
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { phone_number_id: "1341235719073518" },
          messages: [{
            from: "6281199999999",
            id: "wamid.V17LOCAL001",
            timestamp: "1760000000",
            type: "text",
            text: { body: "Halo ReadyScore" },
          }],
          statuses: [{
            id: "wamid.V17LOCAL002",
            status: "delivered",
            timestamp: "1760000001",
            recipient_id: "6281188888888",
          }],
        },
      }],
    }],
  });

  const badSignature = await post(sample, "sha256=" + "0".repeat(64));
  if (badSignature.status !== 401) {
    throw new Error(`bad signature expected 401, got ${badSignature.status}`);
  }

  const invalidJson = await post("{not-json", sign("{not-json"));
  if (invalidJson.status !== 400) {
    throw new Error(`invalid JSON expected 400, got ${invalidJson.status}`);
  }

  const accepted = await post(sample, sign(sample));
  const acceptedBody = await accepted.json();
  if (
    accepted.status !== 200 ||
    acceptedBody?.ok !== true ||
    acceptedBody?.accepted !== true ||
    acceptedBody?.messages !== 1 ||
    acceptedBody?.statuses !== 1
  ) {
    throw new Error(`valid webhook failed: status=${accepted.status} body=${JSON.stringify(acceptedBody)}`);
  }

  console.log("ReadyScore V17.1 WhatsApp Webhook E2E: PASS");
  console.log("GET verification: PASS");
  console.log("Invalid verification rejection: PASS");
  console.log("Invalid signature rejection: PASS");
  console.log("Invalid JSON rejection: PASS");
  console.log("Valid signed webhook normalization: PASS");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!child.killed) child.kill("SIGKILL");
}
