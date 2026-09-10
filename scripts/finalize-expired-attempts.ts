import { claimExpiredAttempts } from "../lib/assessment/assessment-repository";
import { finalizeExpiredAttempt } from "../lib/assessment/runtime-service";

const ids = await claimExpiredAttempts(new Date(), 100);
let finalized = 0;
for (const id of ids) {
  try { await finalizeExpiredAttempt(id); finalized += 1; }
  catch (error) { console.error(`Failed to score expired attempt ${id}:`, error); }
}
console.log(`Expired attempts claimed: ${ids.length}; finalized/scored: ${finalized}`);
