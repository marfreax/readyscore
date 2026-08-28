import type { AssessmentResult } from "../types";
import type { ResultInterpretation } from "../result/types";

export type InterpretationContext = {
  result: AssessmentResult;
  testSpecific?: unknown;
};

export type TestInterpretationEngine = {
  readonly testType: string;
  readonly interpretationVersion: string;
  interpret(context: InterpretationContext): ResultInterpretation & Record<string, unknown>;
};

export class InterpretationEngineConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterpretationEngineConfigurationError";
  }
}
