import type { Question, LikertValue, AssessmentResult } from "./types";

export interface AssessmentSnapshot {
  attemptId: string;
  assessmentType: "free" | "premium" | "riasec" | "disc" | "eq" | "cognitive";
  assessmentConfigurationVersion: string;
  questionBankVersion: string;
  taxonomyVersion: string;
  scoringVersion: string;
  selectionAlgorithmVersion: string;
  attemptSeed: string;
  selectedQuestionIds: string[];
  selectedQuestionSequence: string[];
  selectionMetadata: Record<string, unknown>;
}
export interface RuntimeAttempt {
  attempt: { id:string; assessmentType:"free"|"premium"|"riasec"|"disc"|"eq"|"cognitive"; status:"IN_PROGRESS"|"COMPLETED"|"ABANDONED"|"EXPIRED"; startedAt:string; completedAt?:string; assessmentConfigurationId:string; assessmentConfigurationVersion:string; questionBankVersion:string; scoringVersion:string };
  snapshot: AssessmentSnapshot;
  questions: Question[];
  answers: Map<string,LikertValue>;
  result?: AssessmentResult;
}
const KEY="__readyscore_runtime_attempts_v1";
function getStore(){const g=globalThis as typeof globalThis & {[KEY]?:Map<string,RuntimeAttempt>}; return g[KEY] ??= new Map();}
export const runtimeStore=getStore();
export const saveRuntimeAttempt=(v:RuntimeAttempt)=>runtimeStore.set(v.attempt.id,v);
export const getRuntimeAttempt=(id:string)=>runtimeStore.get(id);
export function getProgress(v:RuntimeAttempt){const total=v.questions.length,answered=v.answers.size;return {answered,total,remaining:Math.max(0,total-answered),percentage:total?Math.round(answered/total*100):0};}
