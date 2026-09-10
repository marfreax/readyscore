import { MappingStatus, QuestionStatus } from "@prisma/client";
import { prisma } from "./db/prisma";

export type ProductionEligibilityCheck = {
  key: string;
  label: string;
  status: "PASS" | "BLOCK";
  detail: string;
  taxonomyNodeId?: string;
  taxonomyNodeCode?: string;
  requiredCount?: number;
  availableCount?: number;
};

export type ProductionEligibility = {
  status: "READY" | "BLOCKED";
  packageVersionId: string;
  packageId: string;
  packageCode: string;
  packageVersion: string;
  taxonomyVersion: string | null;
  totalQuestions: number;
  timeLimitSeconds: number;
  reserveCount: number | null;
  scoringVersion: string | null;
  publicationStatus: string;
  checks: ProductionEligibilityCheck[];
  composition: Array<{
    taxonomyNodeId: string;
    taxonomyNodeCode: string;
    taxonomyNodeName: string;
    nodeType: string;
    requiredCount: number;
    availableCount: number;
  }>;
};

function matches(node: { code: string; nodeType: string }, q: { domain: string; subdomain: string | null; indicator: string | null }) {
  const code = node.code.trim().toUpperCase();
  const type = node.nodeType.trim().toUpperCase();
  const values = type === "DOMAIN" ? [q.domain] : type === "SUBDOMAIN" ? [q.subdomain] : type === "INDICATOR" ? [q.indicator] : [q.domain, q.subdomain, q.indicator];
  return values.some((value) => value?.trim().toUpperCase() === code);
}

// Deterministic bipartite matching. This prevents a question that matches
// multiple composition nodes from being counted twice.
function canSatisfy(questions: Array<{ id: string; domain: string; subdomain: string | null; indicator: string | null }>, rules: Array<{ taxonomyNode: { code: string; nodeType: string }; requiredCount: number }>) {
  const expanded: number[] = [];
  rules.forEach((r, ri) => { for (let i = 0; i < r.requiredCount; i++) expanded.push(ri); });
  const edges = expanded.map((ri) => questions.map((q, qi) => matches(rules[ri].taxonomyNode, q) ? qi : -1).filter((x) => x >= 0));
  const owner = new Map<number, number>();
  function visit(slot: number, seen: Set<number>): boolean {
    for (const qi of edges[slot]) {
      if (seen.has(qi)) continue;
      seen.add(qi);
      const previous = owner.get(qi);
      if (previous === undefined || visit(previous, seen)) { owner.set(qi, slot); return true; }
    }
    return false;
  }
  let matched = 0;
  for (let slot = 0; slot < expanded.length; slot++) if (visit(slot, new Set())) matched++;
  return matched === expanded.length;
}

export async function evaluateQuestionPackageProductionEligibility(versionId: string): Promise<ProductionEligibility> {
  const version = await prisma.questionPackageVersion.findUnique({
    where: { id: versionId },
    include: { package: { include: { testType: true } }, taxonomy: true, compositionRules: { include: { taxonomyNode: true } } },
  });
  if (!version) throw new Error("PACKAGE_VERSION_NOT_FOUND");

  const checks: ProductionEligibilityCheck[] = [];
  const taxonomyOk = Boolean(version.taxonomy && version.taxonomy.status === "ACTIVE" && version.taxonomy.testTypeId === version.package.testTypeId);
  checks.push({ key: "package-publication-boundary", label: "Package publication boundary", status: version.status === "DRAFT" || version.status === "REVIEW" || version.status === "APPROVED" || version.status === "PUBLISHED" ? "PASS" : "BLOCK", detail: `Status ${version.status}` });
  checks.push({ key: "taxonomy-active", label: "Active taxonomy", status: taxonomyOk ? "PASS" : "BLOCK", detail: version.taxonomy ? `${version.taxonomy.version} · ${version.taxonomy.status}` : "Missing taxonomy" });
  checks.push({ key: "test-type", label: "Test Type compatibility", status: taxonomyOk ? "PASS" : "BLOCK", detail: `${version.package.testType.code}` });
  const productionTestType = ["RIASEC", "DISC", "EQ", "COGNITIVE"].includes(version.package.testType.code);
  checks.push({ key: "production-timer", label: "Production timer", status: !productionTestType || version.timeLimitSeconds === 1200 ? "PASS" : "BLOCK", detail: productionTestType ? `${version.timeLimitSeconds} seconds configured / 1200 required` : `${version.timeLimitSeconds} seconds configured` });

  const rows = taxonomyOk ? await prisma.questionVersion.findMany({
    where: { testTypeId: version.package.testTypeId, taxonomyVersion: version.taxonomy!.version, status: QuestionStatus.PUBLISHED, mappingStatus: MappingStatus.APPROVED, text: { not: "" } },
    select: { id: true, questionId: true, domain: true, subdomain: true, indicator: true },
    orderBy: [{ questionId: "asc" }, { createdAt: "desc" }, { id: "desc" }],
  }) : [];
  const latest = new Map<string, typeof rows[number]>();
  for (const row of rows) if (!latest.has(row.questionId)) latest.set(row.questionId, row);
  const questions = [...latest.values()];

  const composition = version.compositionRules.map((rule) => {
    const availableCount = questions.filter((q) => matches(rule.taxonomyNode, q)).length;
    return { taxonomyNodeId: rule.taxonomyNodeId, taxonomyNodeCode: rule.taxonomyNode.code, taxonomyNodeName: rule.taxonomyNode.name, nodeType: rule.taxonomyNode.nodeType, requiredCount: rule.requiredCount, availableCount };
  });
  for (const item of composition) checks.push({ key: `availability:${item.taxonomyNodeId}`, label: `${item.taxonomyNodeCode} eligible questions`, status: item.availableCount >= item.requiredCount ? "PASS" : "BLOCK", detail: `${item.availableCount} eligible / ${item.requiredCount} required`, taxonomyNodeId: item.taxonomyNodeId, taxonomyNodeCode: item.taxonomyNodeCode, requiredCount: item.requiredCount, availableCount: item.availableCount });

  const compositionSatisfied = taxonomyOk && canSatisfy(questions, version.compositionRules);
  checks.push({ key: "composition-selectable", label: "Exact composition selectable", status: compositionSatisfied ? "PASS" : "BLOCK", detail: compositionSatisfied ? "A unique question assignment satisfies every composition rule" : "No unique assignment can satisfy every composition rule" });

  // Reserve is informational at V13.9; reserve questions are not runtime-eligible unless explicitly published/mapped.
  const reserveCount = version.metadata && typeof version.metadata === "object" && !Array.isArray(version.metadata) && typeof (version.metadata as Record<string, unknown>).reserveCount === "number" ? Number((version.metadata as Record<string, unknown>).reserveCount) : null;
  const scoringVersion = version.taxonomy?.metadata && typeof version.taxonomy.metadata === "object" && !Array.isArray(version.taxonomy.metadata) && typeof (version.taxonomy.metadata as Record<string, unknown>).scoringVersion === "string" ? String((version.taxonomy.metadata as Record<string, unknown>).scoringVersion) : null;
  const status = checks.some((c) => c.status === "BLOCK") ? "BLOCKED" : "READY";
  return { status, packageVersionId: version.id, packageId: version.packageId, packageCode: version.package.code, packageVersion: version.version, taxonomyVersion: version.taxonomy?.version ?? null, totalQuestions: version.totalQuestions, timeLimitSeconds: version.timeLimitSeconds, reserveCount, scoringVersion, publicationStatus: version.status, checks, composition };
}

export async function listProductionEligibility() {
  const versions = await prisma.questionPackageVersion.findMany({
    where: { package: { testType: { code: { in: ["RIASEC", "DISC", "EQ", "COGNITIVE"] } } }, status: { in: ["APPROVED", "PUBLISHED", "DRAFT", "REVIEW"] } },
    select: { id: true }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
  return Promise.all(versions.map((version) => evaluateQuestionPackageProductionEligibility(version.id)));
}
