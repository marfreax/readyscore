import fs from "node:fs";
import path from "node:path";
import {
  buildCrossTestProfile,
  listProfileAdapters,
} from "../lib/profile/engine-v1";
import {
  CROSS_TEST_PROFILE_CONTRACT_VERSION,
  CROSS_TEST_PROFILE_ENGINE_VERSION,
  type CrossTestProfileInput,
} from "../lib/profile/types";

type Manifest = {
  version: string;
  status: string;
  delivery: string;
  databaseMigration: boolean;
  measurementRedesign: boolean;
  scoringRedesign: boolean;
  questionBankMutation: boolean;
  universalScore: boolean;
  rawAverageSynthesis: boolean;
  resultSemanticsMutation: boolean;
  crossTestSynthesis: boolean;
  excludedPaths: string[];
};

type PackageJson = {
  scripts?: Record<string, string>;
};

const root = process.cwd();
const read = (filePath: string): string => fs.readFileSync(path.join(root, filePath), "utf8");
const readJson = <T>(filePath: string): T => JSON.parse(read(filePath)) as T;
const fail = (message: string): never => {
  throw new Error(`V9.10 check failed: ${message}`);
};
const assertCondition: (condition: boolean, message: string) => void = (condition, message) => {
  if (!condition) fail(message);
};

console.log("=== READY SCORE V9.10 CROSS-TEST PROFILE GATE ===");

const manifest = readJson<Manifest>("V9_10_DELIVERY_MANIFEST.json");
assertCondition(manifest.version === "V9.10", "manifest version");
assertCondition(manifest.status === "IMPLEMENTED", "manifest status");
assertCondition(manifest.delivery === "FULL", "delivery must be FULL");

const protectedFalseKeys: Array<keyof Pick<
  Manifest,
  | "databaseMigration"
  | "measurementRedesign"
  | "scoringRedesign"
  | "questionBankMutation"
  | "universalScore"
  | "rawAverageSynthesis"
  | "resultSemanticsMutation"
>> = [
  "databaseMigration",
  "measurementRedesign",
  "scoringRedesign",
  "questionBankMutation",
  "universalScore",
  "rawAverageSynthesis",
  "resultSemanticsMutation",
];
for (const key of protectedFalseKeys) {
  assertCondition(manifest[key] === false, `${key} must remain false`);
}

assertCondition(manifest.crossTestSynthesis === true, "crossTestSynthesis must be true");
for (const excludedPath of ["docs/", "node_modules/", ".next/", "__MACOSX/"]) {
  assertCondition(manifest.excludedPaths.includes(excludedPath), `${excludedPath} must be excluded`);
}

const engine = read("lib/profile/engine-v1.ts");
const types = read("lib/profile/types.ts");
const service = read("lib/profile/service.ts");
const page = read("app/profile/page.tsx");
const route = read("app/api/profile/cross-test/route.ts");
const architecture = read("architecture/phase-9.10/ReadyScore_V9_10_Cross_Test_Profile.md");
const pkg = readJson<PackageJson>("package.json");

for (const version of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
  assertCondition(Boolean(pkg.scripts?.[`v9:${version}:gate`]), `V9.${version} gate registration missing`);
}
assertCondition(
  pkg.scripts?.["v9:10:gate"] === "tsx scripts/validate-v9-10-cross-test-profile.ts",
  "V9.10 gate registration incorrect",
);

for (const token of [
  "cognitiveProfileAdapter",
  "discProfileAdapter",
  "eqProfileAdapter",
  "riasecProfileAdapter",
]) {
  assertCondition(engine.includes(token), `engine adapter token missing: ${token}`);
}
assertCondition(types.includes(CROSS_TEST_PROFILE_CONTRACT_VERSION), "profile contract constant missing");
assertCondition(types.includes(CROSS_TEST_PROFILE_ENGINE_VERSION), "profile engine constant missing");
assertCondition(service.includes("V9.10_CROSS_TEST_PROFILE_SERVICE_V1"), "V9.10 service version missing");
assertCondition(
  service.includes("assessmentType.trim().toUpperCase()"),
  "latest-source selection must normalize assessment type",
);
for (const token of [
  "Evidence map",
  "Assessment sources",
  "Observed patterns",
  "Limitations & governance",
  "universal score",
  "raw averaging",
]) {
  assertCondition(page.toLowerCase().includes(token.toLowerCase()), `profile page token missing: ${token}`);
}
assertCondition(
  route.includes("hasFeatureAccess") || service.includes("hasFeatureAccess"),
  "profile entitlement boundary missing",
);
for (const forbidden of ["overallScore =", "reduce((sum", "universal overall score ="]) {
  assertCondition(!page.includes(forbidden), `customer profile must not synthesize score: ${forbidden}`);
}
for (const safety of ["universal score", "raw averaging", "not a cross-test score"]) {
  assertCondition(architecture.toLowerCase().includes(safety), `architecture safety missing: ${safety}`);
}

const mk = (
  type: string,
  id: string,
  testSpecific: unknown,
): CrossTestProfileInput => ({
  result: {
    attemptId: id,
    assessmentType: type,
    scoringVersion: `${type}_SCORE_V2`,
    status: "COMPLETE",
    interpretation: {
      contractVersion: "TEST_RESULT_V1",
      interpretationVersion: `${type}_INTERPRETATION_V1`,
      status: "COMPLETE",
      confidence: "HIGH",
    },
  },
  testSpecific,
});

const cognitive = {
  measurement: {
    testType: "COGNITIVE",
    scoringVersion: "COGNITIVE_SCORE_V2",
    overallScore: 70,
    dimensionScores: [
      "VERBAL_REASONING",
      "NUMERICAL_REASONING",
      "LOGICAL_REASONING",
      "ABSTRACT_REASONING",
    ].map((dimension) => ({
      dimension,
      score: 70,
      answeredCount: 6,
      questionCount: 6,
      correctCount: 4,
    })),
  },
};

const eq = {
  measurement: {
    testType: "EQ",
    dimensionScores: [
      "EMOTION_AWARENESS",
      "EMOTION_REGULATION",
      "EMPATHY_SOCIAL_AWARENESS",
      "RELATIONSHIP_SOCIAL_RESPONSE",
    ].map((dimension) => ({
      dimension,
      score: 70,
      answeredCount: 6,
      questionCount: 6,
    })),
  },
};

const disc = {
  measurement: {
    testType: "DISC",
    scoringVersion: "DISC_SCORE_V2",
    overallScore: 70,
    dimensionScores: ["D", "I", "S", "C"].map((dimension) => ({
      dimension,
      score: 70,
      selectedCount: 7,
      answeredCount: 24,
      questionCount: 24,
    })),
    primaryPattern: "D",
    secondaryPattern: "I",
    profileModel: "IPSATIVE_FORCED_CHOICE",
    scoreMeaning: "SHARE_OF_FORCED_CHOICES",
  },
};

const riasec = {
  measurement: {
    testType: "RIASEC",
    scoringVersion: "RIASEC_SCORE_V2",
    dimensionScores: ["R", "I", "A", "S", "E", "C"].map((dimension) => ({
      dimension,
      score: 70,
      answeredCount: 10,
      questionCount: 10,
      sufficient: true,
    })),
    topCode: "CES",
    coveragePercent: 100,
    measuredDimensionCount: 6,
    isComplete: true,
  },
};

const profile = buildCrossTestProfile(
  [
    mk("COGNITIVE", "c1", cognitive),
    mk("EQ", "e1", eq),
    mk("DISC", "d1", disc),
    mk("RIASEC", "r1", riasec),
  ],
  "2026-09-02T00:00:00.000Z",
);

assertCondition(profile.contractVersion === CROSS_TEST_PROFILE_CONTRACT_VERSION, "contract identity");
assertCondition(profile.engineVersion === CROSS_TEST_PROFILE_ENGINE_VERSION, "engine identity");
assertCondition(profile.completeness.availableDomains === 4, "expected four active evidence domains");
assertCondition(profile.completeness.totalDomains === 7, "expected seven profile domain slots");
assertCondition(profile.domains.find((domain) => domain.domain === "ABILITY")?.signalCount === 4, "ABILITY evidence");
assertCondition(profile.domains.find((domain) => domain.domain === "EMOTIONAL")?.signalCount === 4, "EMOTIONAL evidence");
assertCondition(profile.domains.find((domain) => domain.domain === "BEHAVIOR")?.signalCount === 4, "BEHAVIOR evidence");
assertCondition(profile.domains.find((domain) => domain.domain === "INTEREST")?.signalCount === 6, "INTEREST evidence");
assertCondition(!Object.prototype.hasOwnProperty.call(profile, "overallScore"), "universal overallScore");
assertCondition(
  profile.claims.prohibited.some((claim) => claim.includes("universal overall")),
  "universal score prohibition",
);
assertCondition(
  profile.claims.prohibited.some((claim) => claim.includes("averaging")),
  "raw-average prohibition",
);
assertCondition(
  listProfileAdapters().sort().join(",") === ["COGNITIVE", "DISC", "EQ", "RIASEC"].join(","),
  "all four adapters",
);

const unknown = buildCrossTestProfile([mk("UNKNOWN", "u1", {})], "2026-09-02T00:00:00.000Z");
assertCondition(unknown.sources[0].includedSignalCount === 0, "unknown source must not synthesize evidence");
assertCondition(unknown.completeness.availableDomains === 0, "unknown source must not create domain evidence");

console.log("PASS: V9.10 manifest and protected boundaries");
console.log("PASS: Four assessment adapters registered");
console.log("PASS: Evidence domains 4/7");
console.log("PASS: Latest-source profile architecture");
console.log("PASS: No universal overall score");
console.log("PASS: Raw-average prohibition");
console.log("PASS: Unknown-source safety");
console.log("PASS: Customer profile presentation contract");
console.log("V9.10 CROSS-TEST PROFILE GATE: PASS");
