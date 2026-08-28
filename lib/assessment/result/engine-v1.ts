import type { AssessmentResult } from "../types";
import { riasecInterpretationEngine } from "../interpretation/riasec";
import { interpretDisc, DISC_INTERPRETATION_VERSION } from "../disc/interpretation";
import { interpretEq, EQ_INTERPRETATION_VERSION } from "../eq/interpretation";
import { interpretCognitive, COGNITIVE_INTERPRETATION_VERSION } from "../cognitive/interpretation";
import { InterpretationEngineConfigurationError, type InterpretationContext, type TestInterpretationEngine } from "../interpretation/types";
import type { TestResultEnvelope } from "./types";

const discInterpretationEngine: TestInterpretationEngine = {
  testType: "DISC",
  interpretationVersion: DISC_INTERPRETATION_VERSION,
  interpret({ result }) {
    return interpretDisc(result as typeof result & { disc?: { measurement?: { primaryPattern:"D"|"I"|"S"|"C"; secondaryPattern:"D"|"I"|"S"|"C" } } });
  },
};

const eqInterpretationEngine: TestInterpretationEngine = {
  testType: "EQ",
  interpretationVersion: EQ_INTERPRETATION_VERSION,
  interpret({ result }) {
    return interpretEq(result as typeof result & { eq?: { measurement?: { dimensionScores?: Array<{ dimension: "EMOTION_AWARENESS"|"EMOTION_REGULATION"|"EMPATHY_SOCIAL_AWARENESS"|"RELATIONSHIP_SOCIAL_RESPONSE"; score:number; answeredCount:number; questionCount:number }> } } });
  },
};

const cognitiveInterpretationEngine: TestInterpretationEngine = {
  testType: "COGNITIVE",
  interpretationVersion: COGNITIVE_INTERPRETATION_VERSION,
  interpret({ result }) {
    return interpretCognitive(result as Parameters<typeof interpretCognitive>[0]);
  },
};

const ENGINES: TestInterpretationEngine[] = [riasecInterpretationEngine, discInterpretationEngine, eqInterpretationEngine, cognitiveInterpretationEngine];
const REGISTRY = new Map(ENGINES.map((engine) => [engine.testType.toLowerCase(), engine]));

export function getInterpretationEngine(testType: string): TestInterpretationEngine {
  const engine = REGISTRY.get(testType.toLowerCase());
  if (!engine) {
    throw new InterpretationEngineConfigurationError(`No interpretation engine registered for test type "${testType}".`);
  }
  return engine;
}

export function interpretAssessmentResult(
  result: AssessmentResult,
  testSpecific?: unknown,
): TestResultEnvelope {
  const engine = getInterpretationEngine(result.assessmentType);
  const interpretation = engine.interpret({ result, testSpecific } satisfies InterpretationContext);
  return { ...result, interpretation };
}

export function listInterpretationEngines(): Array<{ testType: string; interpretationVersion: string }> {
  return ENGINES.map((engine) => ({
    testType: engine.testType,
    interpretationVersion: engine.interpretationVersion,
  }));
}
