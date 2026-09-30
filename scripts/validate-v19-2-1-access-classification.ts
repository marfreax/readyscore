import { deriveAccessLevel } from "../lib/commercial/types";

const test = (resourceKey: string) => ({
  type: "TEST_ACCESS",
  resourceType: "TEST_TYPE",
  resourceKey,
});

const profile = {
  type: "PROFILE_ACCESS",
  resourceType: "FEATURE",
  resourceKey: "CROSS_TEST_PROFILE_V1",
};

const core = ["COGNITIVE", "EQ", "DISC", "RIASEC", "WORK_ATTITUDE", "LEARNING_PREFERENCE"];

function assert(name: string, actual: string, expected: string) {
  if (actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}`);
  console.log(`PASS — ${name}`);
}

assert("0 active tests => FREE", deriveAccessLevel([]).level, "FREE");
assert("1 active test => SINGLE_TEST", deriveAccessLevel([test(core[0])]).level, "SINGLE_TEST");
assert("2 active tests => CUSTOM_ACCESS", deriveAccessLevel(core.slice(0, 2).map(test)).level, "CUSTOM_ACCESS");
assert("3 active tests => CUSTOM_ACCESS", deriveAccessLevel(core.slice(0, 3).map(test)).level, "CUSTOM_ACCESS");
assert("5 active tests => CUSTOM_ACCESS", deriveAccessLevel(core.slice(0, 5).map(test)).level, "CUSTOM_ACCESS");
assert("6 active tests => ALL_TESTS", deriveAccessLevel(core.map(test)).level, "ALL_TESTS");
assert("6 active tests + profiling => ADVANCE", deriveAccessLevel([...core.map(test), profile]).level, "ADVANCE");

const duplicateOrders = [test("COGNITIVE"), test("EQ"), test("EQ"), test("DISC")];
assert("duplicate entitlement rows do not inflate count", deriveAccessLevel(duplicateOrders).coreTestCount.toString(), "3");

console.log("PASS — V19.2.1 actual-entitlement access classification");
