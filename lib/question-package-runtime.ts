import { QuestionStatus, MappingStatus } from "@prisma/client";
import { prisma } from "./db/prisma";
import { ASSESSMENT_CONFIG, type AssessmentType } from "./assessment-config";
import type { SelectedQuestion } from "./assessment/question-engine";

export const V13_2_SELECTION_ALGORITHM_VERSION = "V13.2_COMPOSITION_SELECTION_V1";

const SUPPORTED_TYPES = ["riasec", "disc", "eq", "cognitive"] as const;
type SupportedAssessmentType = typeof SUPPORTED_TYPES[number];

const TEST_TYPE_BY_ASSESSMENT: Record<SupportedAssessmentType, string> = {
  riasec: "RIASEC",
  disc: "DISC",
  eq: "EQ",
  cognitive: "COGNITIVE",
};

export type RuntimePackageReadiness = {
  packageId: string;
  packageCode: string;
  packageVersionId: string;
  packageVersion: string;
  testTypeId: string;
  testTypeCode: string;
  taxonomyVersionId: string;
  taxonomyVersion: string;
  totalQuestions: number;
  timeLimitSeconds: number;
  selectionAlgorithmVersion: string;
  composition: Array<{
    taxonomyNodeId: string;
    taxonomyNodeCode: string;
    taxonomyNodeName: string;
    nodeType: string;
    requiredCount: number;
    availableCount: number;
  }>;
};

export class PackageSelectionError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "PackageSelectionError";
  }
}

function isSupported(type: AssessmentType): type is SupportedAssessmentType {
  return (SUPPORTED_TYPES as readonly string[]).includes(type);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    h = (h * 1664525 + 1013904223) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function nodeMatchesQuestion(node: { code: string; nodeType: string }, question: {
  domain: string;
  subdomain: string | null;
  indicator: string | null;
}) {
  const code = node.code.trim().toUpperCase();
  const fields =
    node.nodeType.toUpperCase() === "DOMAIN"
      ? [question.domain]
      : node.nodeType.toUpperCase() === "SUBDOMAIN"
        ? [question.subdomain]
        : node.nodeType.toUpperCase() === "INDICATOR"
          ? [question.indicator]
          : [question.domain, question.subdomain, question.indicator];

  return fields.some((value) => value?.trim().toUpperCase() === code);
}

async function loadEligibleQuestions(
  testTypeId: string,
  taxonomyVersion: string,
) {
  const rows = await prisma.questionVersion.findMany({
    where: {
      testTypeId,
      taxonomyVersion,
      status: QuestionStatus.PUBLISHED,
      mappingStatus: MappingStatus.APPROVED,
      text: { not: "" },
    },
    include: { question: true },
    orderBy: [{ questionId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
  });

  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  }

  return [...latest.values()];
}

async function validatePublishedPackage(versionId: string, expectedTestTypeCode: string) {
  const version = await prisma.questionPackageVersion.findUnique({
    where: { id: versionId },
    include: {
      package: { include: { testType: true } },
      taxonomy: true,
      compositionRules: { include: { taxonomyNode: true } },
    },
  });

  if (!version) throw new PackageSelectionError("PACKAGE_VERSION_NOT_FOUND", "Question Package version tidak ditemukan.");
  if (version.status !== "PUBLISHED") {
    throw new PackageSelectionError("PACKAGE_NOT_PUBLISHED", "Question Package belum berstatus PUBLISHED.");
  }
  if (version.package.testType.code !== expectedTestTypeCode) {
    throw new PackageSelectionError("PACKAGE_TEST_TYPE_MISMATCH", "Question Package tidak sesuai Test Type.");
  }
  if (!version.taxonomy || version.taxonomy.status !== "ACTIVE") {
    throw new PackageSelectionError("PACKAGE_TAXONOMY_NOT_ACTIVE", "Taxonomy package tidak aktif.");
  }
  if (version.taxonomy.testTypeId !== version.package.testTypeId) {
    throw new PackageSelectionError("PACKAGE_TAXONOMY_TEST_TYPE_MISMATCH", "Taxonomy package tidak sesuai Test Type.");
  }
  const expectedScoringVersion = ASSESSMENT_CONFIG[
    expectedTestTypeCode === "RIASEC" ? "riasec" :
    expectedTestTypeCode === "DISC" ? "disc" :
    expectedTestTypeCode === "EQ" ? "eq" : "cognitive"
  ].scoringVersion;
  const taxonomyMetadata =
    version.taxonomy.metadata &&
    typeof version.taxonomy.metadata === "object" &&
    !Array.isArray(version.taxonomy.metadata)
      ? version.taxonomy.metadata as Record<string, unknown>
      : {};
  if (typeof taxonomyMetadata.scoringVersion === "string" && taxonomyMetadata.scoringVersion !== expectedScoringVersion) {
    throw new PackageSelectionError("PACKAGE_SCORING_MISMATCH", "Taxonomy package tidak kompatibel dengan scoring configuration aktif.");
  }
  if (!Number.isInteger(version.totalQuestions) || version.totalQuestions <= 0) {
    throw new PackageSelectionError("INVALID_PACKAGE_TOTAL", "Total question package tidak valid.");
  }
  const expectedQuestionCount = ASSESSMENT_CONFIG[
    expectedTestTypeCode === "RIASEC" ? "riasec" :
    expectedTestTypeCode === "DISC" ? "disc" :
    expectedTestTypeCode === "EQ" ? "eq" : "cognitive"
  ].questionCount;
  if (version.totalQuestions !== expectedQuestionCount) {
    throw new PackageSelectionError("PACKAGE_QUESTION_COUNT_MISMATCH", "Total question package tidak kompatibel dengan assessment configuration aktif.");
  }
  if (!Number.isInteger(version.timeLimitSeconds) || version.timeLimitSeconds <= 0) {
    throw new PackageSelectionError("INVALID_PACKAGE_TIMER", "Timer package tidak valid.");
  }
  if (version.timeLimitSeconds !== 1200) {
    throw new PackageSelectionError("PACKAGE_PRODUCTION_TIMER_MISMATCH", "Production package harus menggunakan timer 1200 detik.");
  }
  if (!version.compositionRules.length) {
    throw new PackageSelectionError("PACKAGE_COMPOSITION_MISSING", "Composition package belum dikonfigurasi.");
  }
  const sum = version.compositionRules.reduce((n, rule) => n + rule.requiredCount, 0);
  if (sum !== version.totalQuestions) {
    throw new PackageSelectionError("PACKAGE_COMPOSITION_TOTAL_MISMATCH", "Composition package tidak sama dengan total question.");
  }
  if (version.compositionRules.some((rule) => !Number.isInteger(rule.requiredCount) || rule.requiredCount <= 0)) {
    throw new PackageSelectionError("PACKAGE_COMPOSITION_INVALID", "Composition package memiliki count tidak valid.");
  }
  if (new Set(version.compositionRules.map((rule) => rule.taxonomyNodeId)).size !== version.compositionRules.length) {
    throw new PackageSelectionError("PACKAGE_COMPOSITION_DUPLICATE", "Composition package memiliki taxonomy node duplikat.");
  }
  if (version.compositionRules.some((rule) => rule.taxonomyNode.taxonomyId !== version.taxonomyVersionId)) {
    throw new PackageSelectionError("PACKAGE_COMPOSITION_TAXONOMY_MISMATCH", "Composition node tidak berada pada taxonomy package.");
  }

  return version;
}


type CompositionFlowEdge = {
  to: number;
  rev: number;
  capacity: number;
  original: number;
  meta?: { questionIndex?: number; ruleIndex?: number };
};

function buildCompositionSelection(
  questions: Array<Awaited<ReturnType<typeof loadEligibleQuestions>>[number]>,
  rules: Array<{ taxonomyNode: { code: string; nodeType: string }; requiredCount: number }>,
  seed: string,
) {
  const candidateSets = rules.map((rule) =>
    seededShuffle(
      questions.filter((question) => nodeMatchesQuestion(rule.taxonomyNode, question)),
      `${seed}:QUESTION:${rule.taxonomyNode.code}`,
    ),
  );

  if (candidateSets.some((set, index) => set.length < rules[index].requiredCount)) {
    return null;
  }

  // Bipartite max-flow: each logical Question can satisfy at most one
  // composition rule, while each rule receives exactly requiredCount questions.
  const source = 0;
  const questionOffset = 1;
  const ruleOffset = questionOffset + questions.length;
  const sink = ruleOffset + rules.length;
  const graph: CompositionFlowEdge[][] = Array.from({ length: sink + 1 }, () => []);
  const addEdge = (from: number, to: number, capacity: number, meta?: { questionIndex?: number; ruleIndex?: number }) => {
    const forward: CompositionFlowEdge = { to, rev: graph[to].length, capacity, original: capacity, meta };
    const reverse: CompositionFlowEdge = { to: from, rev: graph[from].length, capacity: 0, original: 0 };
    graph[from].push(forward);
    graph[to].push(reverse);
  };

  questions.forEach((_question, index) => addEdge(source, questionOffset + index, 1));
  rules.forEach((rule, ruleIndex) => addEdge(ruleOffset + ruleIndex, sink, rule.requiredCount));
  const questionIndexById = new Map(questions.map((question, index) => [question.questionId, index]));

  candidateSets.forEach((candidates, ruleIndex) => {
    for (const question of candidates) {
      const questionIndex = questionIndexById.get(question.questionId);
      if (questionIndex !== undefined) {
        addEdge(questionOffset + questionIndex, ruleOffset + ruleIndex, 1, { questionIndex, ruleIndex });
      }
    }
  });

  let flow = 0;
  while (true) {
    const level = Array(graph.length).fill(-1);
    const queue = [source];
    level[source] = 0;
    for (let head = 0; head < queue.length; head += 1) {
      const node = queue[head];
      for (const edge of graph[node]) {
        if (edge.capacity > 0 && level[edge.to] < 0) {
          level[edge.to] = level[node] + 1;
          queue.push(edge.to);
        }
      }
    }
    if (level[sink] < 0) break;

    const it = Array(graph.length).fill(0);
    const dfs = (node: number, pushed: number): number => {
      if (node === sink) return pushed;
      for (let i = it[node]; i < graph[node].length; i = ++it[node]) {
        const edge = graph[node][i];
        if (edge.capacity <= 0 || level[edge.to] !== level[node] + 1) continue;
        const sent = dfs(edge.to, Math.min(pushed, edge.capacity));
        if (sent > 0) {
          edge.capacity -= sent;
          graph[edge.to][edge.rev].capacity += sent;
          return sent;
        }
      }
      return 0;
    };

    while (true) {
      const pushed = dfs(source, Number.MAX_SAFE_INTEGER);
      if (!pushed) break;
      flow += pushed;
    }
  }

  const requiredTotal = rules.reduce((sum, rule) => sum + rule.requiredCount, 0);
  if (flow !== requiredTotal) return null;

  const selectedByQuestion = new Set<string>();
  const selected: typeof questions = [];
  for (let questionIndex = 0; questionIndex < questions.length; questionIndex += 1) {
    const edges = graph[questionOffset + questionIndex];
    if (edges.some((edge) =>
      edge.meta?.questionIndex === questionIndex &&
      edge.meta.ruleIndex !== undefined &&
      edge.original === 1 &&
      edge.capacity === 0
    )) {
      const question = questions[questionIndex];
      if (!selectedByQuestion.has(question.questionId)) {
        selectedByQuestion.add(question.questionId);
        selected.push(question);
      }
    }
  }
  return selected.length === requiredTotal ? selected : null;
}

async function findRuntimeEligiblePackages(type: SupportedAssessmentType) {
  const expectedCode = TEST_TYPE_BY_ASSESSMENT[type];
  const versions = await prisma.questionPackageVersion.findMany({
    where: {
      status: "PUBLISHED",
      package: { testType: { code: expectedCode } },
      taxonomy: { status: "ACTIVE" },
    },
    include: {
      package: { include: { testType: true } },
      taxonomy: true,
      compositionRules: { include: { taxonomyNode: true } },
    },
    orderBy: [{ packageId: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
  });

  // One published version per logical package is the runtime boundary.
  const latestPublished = new Map<string, (typeof versions)[number]>();
  for (const version of versions) {
    if (!latestPublished.has(version.packageId)) latestPublished.set(version.packageId, version);
  }

  const candidates: RuntimePackageReadiness[] = [];
  for (const raw of latestPublished.values()) {
    let version;
    try {
      version = await validatePublishedPackage(raw.id, expectedCode);
    } catch {
      continue;
    }

    const eligible = await loadEligibleQuestions(version.package.testTypeId, version.taxonomy!.version);
    const composition = version.compositionRules.map((rule) => {
      const availableCount = eligible.filter((q) => nodeMatchesQuestion(rule.taxonomyNode, q)).length;
      return {
        taxonomyNodeId: rule.taxonomyNodeId,
        taxonomyNodeCode: rule.taxonomyNode.code,
        taxonomyNodeName: rule.taxonomyNode.name,
        nodeType: rule.taxonomyNode.nodeType,
        requiredCount: rule.requiredCount,
        availableCount,
      };
    });

    if (composition.some((item) => item.availableCount < item.requiredCount)) continue;
    if (!buildCompositionSelection(eligible, version.compositionRules, `READINESS:${version.id}`)) continue;

    const selectionAlgorithmVersion =
      version.metadata &&
      typeof version.metadata === "object" &&
      !Array.isArray(version.metadata) &&
      typeof (version.metadata as Record<string, unknown>).selectionAlgorithmVersion === "string"
        ? String((version.metadata as Record<string, unknown>).selectionAlgorithmVersion)
        : V13_2_SELECTION_ALGORITHM_VERSION;

    candidates.push({
      packageId: version.packageId,
      packageCode: version.package.code,
      packageVersionId: version.id,
      packageVersion: version.version,
      testTypeId: version.package.testTypeId,
      testTypeCode: version.package.testType.code,
      taxonomyVersionId: version.taxonomyVersionId!,
      taxonomyVersion: version.taxonomy!.version,
      totalQuestions: version.totalQuestions,
      timeLimitSeconds: version.timeLimitSeconds,
      selectionAlgorithmVersion,
      composition,
    });
  }

  return candidates;
}

export async function getRuntimeEligibleQuestionPackages(type: AssessmentType) {
  if (!isSupported(type)) return [];
  return findRuntimeEligiblePackages(type);
}

export async function selectPackageAndQuestions(type: SupportedAssessmentType, seed: string) {
  const packages = await findRuntimeEligiblePackages(type);
  if (!packages.length) {
    throw new PackageSelectionError(
      "NO_RUNTIME_ELIGIBLE_PACKAGE",
      `Tidak ada Question Package runtime-eligible untuk ${TEST_TYPE_BY_ASSESSMENT[type]}.`,
    );
  }

  const selectedPackage = seededShuffle(
    packages,
    `${seed}:PACKAGE:${TEST_TYPE_BY_ASSESSMENT[type]}`,
  )[0];

  const packageVersion = await validatePublishedPackage(
    selectedPackage.packageVersionId,
    TEST_TYPE_BY_ASSESSMENT[type],
  );

  const eligible = await loadEligibleQuestions(
    selectedPackage.testTypeId,
    selectedPackage.taxonomyVersion,
  );

  const selectedRows = buildCompositionSelection(
    eligible,
    packageVersion.compositionRules,
    seed,
  );
  if (!selectedRows) {
    throw new PackageSelectionError(
      "INSUFFICIENT_COMPOSITION_QUESTIONS",
      "Eligible question pool tidak dapat memenuhi seluruh composition secara bersamaan.",
    );
  }

  const selected: SelectedQuestion[] = selectedRows.map((row) => ({
    id: row.question.code,
    code: row.question.code,
    text: row.text,
    domain: row.domain,
    subdomain: row.subdomain,
    indicator: row.indicator,
    type: row.type,
    answerType: row.answerType as SelectedQuestion["answerType"],
    reverseScore: row.reverseScore,
    weight: row.weight,
    scoringKey: row.scoringKey.map(Number),
    scale: row.scale.map(Number),
    options: Array.isArray(row.options) ? row.options.map(String) : undefined,
    correctOption: typeof row.correctOption === "number" ? row.correctOption : undefined,
    difficulty: String(row.difficulty).toUpperCase() as SelectedQuestion["difficulty"],
    status: String(row.status).toUpperCase() as SelectedQuestion["status"],
    mappingStatus: String(row.mappingStatus).toUpperCase() as SelectedQuestion["mappingStatus"],
    version: row.version,
    source: row.sourceFile ?? "POSTGRESQL",
    taxonomyVersion: row.taxonomyVersion,
    questionRecordId: row.question.id,
    questionVersionId: row.id,
  }));
  const duplicateIds = new Set<string>();
  for (const question of selected) {
    if (duplicateIds.has(question.questionRecordId)) {
      throw new PackageSelectionError(
        "DUPLICATE_SELECTED_QUESTION",
        `Question ${question.code} terpilih lebih dari sekali melalui composition overlap.`,
      );
    }
    duplicateIds.add(question.questionRecordId);
  }

  if (selected.length !== packageVersion.totalQuestions) {
    throw new PackageSelectionError(
      "SELECTION_COUNT_MISMATCH",
      "Jumlah question hasil package selection tidak sesuai total package.",
    );
  }

  // Package selection and presentation order are separate operations.
  const ordered = seededShuffle(
    selected,
    `${seed}:ORDER:${selectedPackage.packageVersionId}`,
  );

  return {
    package: selectedPackage,
    questions: ordered,
  };
}

export function packageSnapshotMetadata(
  pkg: RuntimePackageReadiness,
  attemptSeed: string,
  questions: SelectedQuestion[],
) {
  return {
    packageId: pkg.packageId,
    packageCode: pkg.packageCode,
    packageVersionId: pkg.packageVersionId,
    packageVersion: pkg.packageVersion,
    packageTotalQuestions: pkg.totalQuestions,
    timeLimitSeconds: pkg.timeLimitSeconds,
    taxonomyVersionId: pkg.taxonomyVersionId,
    taxonomyVersion: pkg.taxonomyVersion,
    selectionAlgorithmVersion: pkg.selectionAlgorithmVersion,
    attemptSeed,
    composition: pkg.composition.map((item) => ({
      taxonomyNodeId: item.taxonomyNodeId,
      taxonomyNodeCode: item.taxonomyNodeCode,
      requiredCount: item.requiredCount,
      availableCount: item.availableCount,
    })),
    selectedQuestionIds: questions.map((q) => q.id),
    selectedQuestionVersionIds: questions.map((q) => q.questionVersionId),
    selectedQuestionSequence: questions.map((q) => q.id),
  };
}
