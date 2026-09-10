export const ANSWER_SCALE = [1, 2, 3, 4, 5] as const;
export type LikertValue = (typeof ANSWER_SCALE)[number];
export type CognitiveOptionValue = 1 | 2 | 3 | 4;
export type QuestionAnswerType = "LIKERT_5" | "SINGLE_CHOICE_4";

export type QuestionStatus =
  | "DRAFT" | "VALIDATED" | "MAPPED" | "REVIEW_REQUIRED" | "APPROVED" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
export type MappingStatus = "UNMAPPED" | "PARTIAL" | "MAPPED" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";
export type MappingMethod = "MANUAL" | "RULE" | "AI_ASSISTED" | "IMPORT";
export type ReviewStatus = "NOT_REVIEWED" | "REVIEW_REQUIRED" | "APPROVED" | "REJECTED";
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED" | "EXPIRED";
export type ResultStatus = "COMPLETE" | "PARTIAL" | "INVALID";
export type ScoreBand = "PERLU_PENGEMBANGAN" | "CUKUP" | "BAIK" | "SANGAT_BAIK" | "UNGGUL";

export interface Domain { id:string; code:string; name:string; description?:string; sortOrder:number; status:"ACTIVE"|"INACTIVE"; version:string; }
export interface Subdomain { id:string; domainId:string; code:string; name:string; description?:string; sortOrder:number; status:"ACTIVE"|"INACTIVE"; version:string; }
export interface Indicator { id:string; subdomainId:string; code:string; name:string; description?:string; sortOrder:number; status:"ACTIVE"|"INACTIVE"; version:string; }
export interface QuestionMapping { questionId:string; domainId:string; subdomainId?:string; indicatorId?:string; status:MappingStatus; method:MappingMethod; confidence?:number; reviewStatus:ReviewStatus; reviewedBy?:string; reviewedAt?:string; version:string; }
export interface Question {
  id:string; code:string; text:string; domain:string; subdomain?:string|null; indicator?:string|null; type?:string; answerType:QuestionAnswerType;
  scale:readonly number[]; reverseScore:boolean; scoringKey:readonly number[];
  options?: readonly string[]; correctOption?: number | null; weight:number;
  difficulty:"EASY"|"MEDIUM"|"HARD"|"UNSPECIFIED"|"Medium"; status:QuestionStatus|"Draft"|"Validated"|"Published";
  mappingStatus:MappingStatus; mapping?:QuestionMapping; version:string; source?:string; createdAt?:string; updatedAt?:string;
}
export interface AssessmentQuestion { questionId:string; sequence:number; domainId:string; subdomainId?:string; indicatorId?:string; required:boolean; }
export interface AssessmentConfiguration { id:string; code:string; name:string; version:string; status:AssessmentStatus; questionCount:number; questionSelection:{domainQuota?:Record<string,number>;requirePublishedQuestions:boolean;preventDuplicateQuestions:boolean}; scoringVersion:string; }
export interface AssessmentAttempt { id:string; assessmentConfigurationId:string; assessmentConfigurationVersion:string; questionBankVersion:string; scoringVersion:string; status:AttemptStatus; startedAt:string; completedAt?:string; }
export interface Answer { questionId:string; value:number; }
export interface ScoredAnswer { questionId:string; rawValue:number; scoredValue:number; questionScore:number; weightedValue:number; weight:number; domain:string; subdomain:string|null; indicator:string|null; }
export interface AssessmentAnswer { attemptId:string; questionId:string; rawValue:number; scoredValue:number; weight:number; sequence:number; }
export interface IndicatorScore { domainId:string; subdomainId:string; indicatorId:string; score:number; questionCount:number; weightTotal:number; }
export interface SubdomainScore { domainId:string; subdomainId:string; score:number; scoredIndicatorCount:number; totalIndicatorCount:number; sufficient:boolean; }
export interface DomainScore { domainId:string; score:number; questionCount:number; weightTotal:number; scoredSubdomainCount:number; totalSubdomainCount:number; sufficient:boolean; }
import type { RiasecPersistableResult } from "./riasec/result-contract";

export interface AssessmentResult {
  attemptId:string; assessmentType:string; assessmentConfigurationVersion:string; questionBankVersion:string; taxonomyVersion:string; scoringVersion:string;
  overallScore:number; band:ScoreBand; status:ResultStatus; domainScores:DomainScore[]; subdomainScores:SubdomainScore[]; indicatorScores:IndicatorScore[];
  coverage:Array<{domainId:string;answeredIndicators:number;totalIndicators:number;percentage:number}>;
  dataSufficiency:{scoredDomains:number;totalDomains:number;requiredDomains:number;percentage:number}; completedAt:string;
  riasec?: RiasecPersistableResult;
  eq?: {
    contractVersion: "EQ_RESULT_V2";
    measurement: {
      testType: "EQ";
      scoringVersion: "EQ_SCORE_V2";
      dimensionScores: Array<{ dimension: "EMOTION_AWARENESS"|"EMOTION_REGULATION"|"EMPATHY_SOCIAL_AWARENESS"|"RELATIONSHIP_SOCIAL_RESPONSE"; score: number; answeredCount: number; questionCount: number }>;
      overallScore: number;
    };
  };
  cognitive?: {
    contractVersion: "COGNITIVE_RESULT_V2";
    measurement: {
      testType: "COGNITIVE";
      scoringVersion: "COGNITIVE_SCORE_V2";
      dimensionScores: Array<{
        dimension: "VERBAL_REASONING"|"NUMERICAL_REASONING"|"LOGICAL_REASONING"|"ABSTRACT_REASONING";
        score: number;
        answeredCount: number;
        questionCount: number;
        correctCount?: number;
      }>;
      overallScore: number;
    };
  };
  disc?: {
    contractVersion: "DISC_RESULT_V2";
    measurement: {
      testType: "DISC";
      scoringVersion: "DISC_SCORE_V2";
      primaryPattern: "D"|"I"|"S"|"C";
      secondaryPattern: "D"|"I"|"S"|"C";
      dimensionScores: Array<{ dimension: "D"|"I"|"S"|"C"; score: number; answeredCount: number; questionCount: number }>;
      profileModel: "IPSATIVE_FORCED_CHOICE";
      scoreMeaning: "SHARE_OF_FORCED_CHOICES";
    };
  };
  interpretation?: {
    contractVersion:string;
    interpretationVersion:string;
    status:"COMPLETE"|"PARTIAL"|"INSUFFICIENT";
    summary:string;
    confidence:"HIGH"|"MODERATE"|"LIMITED";
    claims:{allowed:string[];restricted:string[];prohibited:string[]};
    [key:string]:unknown;
  };
}
