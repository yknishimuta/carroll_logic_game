import type {
  AbstractProposition,
  ConcreteProposition,
} from "./proposition";
import type { LocalizedText } from "./locale";

export interface ConcreteSyllogism {
  readonly firstPremise: ConcreteProposition;
  readonly secondPremise: ConcreteProposition;
}

export interface AbstractSyllogism {
  readonly firstPremise: AbstractProposition;
  readonly secondPremise: AbstractProposition;
}

export interface SyllogismProblemDefinition {
  readonly id: string;
  readonly title: LocalizedText;
  readonly premises: ConcreteSyllogism;
}
