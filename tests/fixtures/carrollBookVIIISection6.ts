import type { SyllogismConclusion } from "../../src/domain/conclusion";
import type { AbstractProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import {
  carrollConclusion,
  carrollAnswerSource,
  carrollProposition,
  carrollSource,
  type CarrollSourceMetadata,
  type CarrollAnswerSourceMetadata,
} from "../helpers/carrollBookVIII";
import type { CarrollFallacy } from "./carrollBookVIIISection4";

export type CarrollSection6Expected =
  | { readonly kind: "right" }
  | {
      readonly kind: "wrong";
      readonly correctConclusion: SyllogismConclusion;
    }
  | {
      readonly kind: "no-conclusion";
      readonly fallacy: CarrollFallacy;
    }
  | {
      readonly kind: "incomplete";
      readonly omittedInformation: readonly SyllogismConclusion[];
    };

export interface CarrollBookVIIISection6Case {
  readonly section: 6;
  readonly number: number;
  readonly source: CarrollSourceMetadata;
  readonly answerSource: CarrollAnswerSourceMetadata;
  readonly sourceText: readonly [string, string, string];
  readonly premises: AbstractSyllogism;
  readonly proposedConclusion: SyllogismConclusion;
  readonly expected: CarrollSection6Expected;
}

const A = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("A", subject, predicate);
const E = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("E", subject, predicate);
const I = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("I", subject, predicate);
const C = carrollConclusion;

const RIGHT: CarrollSection6Expected = { kind: "right" };
const LIKE: CarrollSection6Expected = {
  kind: "no-conclusion",
  fallacy: "like-eliminands-not-asserted-to-exist",
};
const UNLIKE: CarrollSection6Expected = {
  kind: "no-conclusion",
  fallacy: "unlike-eliminands-with-entity-premiss",
};

function hasRole(proposition: AbstractProposition, role: "S" | "P"): boolean {
  return proposition.subject.role === role || proposition.predicate.role === role;
}

function normalizePremises(
  sourceFirstPremise: AbstractProposition,
  sourceSecondPremise: AbstractProposition,
): AbstractSyllogism {
  const sourcePremises = [sourceFirstPremise, sourceSecondPremise] as const;
  const firstPremise = sourcePremises.find((premise) => hasRole(premise, "P"));
  const secondPremise = sourcePremises.find((premise) => hasRole(premise, "S"));
  if (firstPremise === undefined || secondPremise === undefined) {
    throw new Error("A §6 case must contain one M/P and one S/M premise.");
  }
  return { firstPremise, secondPremise };
}

function section6Case(
  number: number,
  sourceText: readonly [string, string, string],
  sourceFirstPremise: AbstractProposition,
  sourceSecondPremise: AbstractProposition,
  proposedConclusion: SyllogismConclusion,
  expected: CarrollSection6Expected = RIGHT,
): CarrollBookVIIISection6Case {
  return {
    section: 6,
    number,
    source: carrollSource(6, number),
    answerSource: carrollAnswerSource(6, number),
    sourceText,
    premises: normalizePremises(sourceFirstPremise, sourceSecondPremise),
    proposedConclusion,
    expected,
  };
}

// The three propositions and assessments below are fixed transcriptions from
// Book VIII, Chapter I, §6 (printed pp. 106–107) and “Answers to §6”
// (printed pp. 130–131). The third proposition is always the proposed
// conclusion, never an additional premise.
export const CARROLL_BOOK_VIII_SECTION_6 = [
  section6Case(1, ["Some x are m", "No m are y′", "Some x are y"], I("x", "m"), E("m", "y′"), C("I", "x", "y")),
  section6Case(2, ["All x are m", "No y are m′", "No y are x′"], A("x", "m"), E("y", "m′"), C("E", "y", "x′"), LIKE),
  section6Case(3, ["Some x are m′", "All y′ are m", "Some x are y"], I("x", "m′"), A("y′", "m"), C("I", "x", "y")),
  section6Case(4, ["All x are m", "No y are m", "All x are y′"], A("x", "m"), E("y", "m"), C("A", "x", "y′")),
  section6Case(5, ["Some m′ are x′", "No m′ are y", "Some x′ are y′"], I("m′", "x′"), E("m′", "y"), C("I", "x′", "y′")),
  section6Case(6, ["No x′ are m", "All y are m′", "All y are x′"], E("x′", "m"), A("y", "m′"), C("A", "y", "x′"), LIKE),
  section6Case(7, ["Some m′ are x′", "All y′ are m′", "Some x′ are y′"], I("m′", "x′"), A("y′", "m′"), C("I", "x′", "y′"), UNLIKE),
  section6Case(8, ["No m′ are x′", "All y′ are m′", "All y′ are x"], E("m′", "x′"), A("y′", "m′"), C("A", "y′", "x")),
  section6Case(9, ["Some m are x′", "No m are y", "Some x′ are y′"], I("m", "x′"), E("m", "y"), C("I", "x′", "y′")),
  section6Case(10, ["All m′ are x′", "All m′ are y", "Some y are x′"], A("m′", "x′"), A("m′", "y"), C("I", "y", "x′")),
  section6Case(11, ["All x are m′", "Some y are m", "Some y are x′"], A("x", "m′"), I("y", "m"), C("I", "y", "x′")),
  section6Case(12, ["No x are m", "No m′ are y′", "No x are y′"], E("x", "m"), E("m′", "y′"), C("E", "x", "y′")),
  section6Case(13, ["No x are m", "All y′ are m", "All y′ are x′"], E("x", "m"), A("y′", "m"), C("A", "y′", "x′")),
  section6Case(14, ["All m′ are x′", "All m′ are y", "Some y are x′"], A("m′", "x′"), A("m′", "y"), C("I", "y", "x′")),
  section6Case(15, ["Some m are x′", "All y are m′", "Some x′ are y′"], I("m", "x′"), A("y", "m′"), C("I", "x′", "y′")),
  section6Case(16, ["No x′ are m", "All y′ are m′", "Some y′ are x"], E("x′", "m"), A("y′", "m′"), C("I", "y′", "x"), LIKE),
  section6Case(17, ["No m′ are x", "All m′ are y′", "Some x′ are y′"], E("m′", "x"), A("m′", "y′"), C("I", "x′", "y′")),
  section6Case(18, ["No x′ are m", "Some m are y", "Some x are y"], E("x′", "m"), I("m", "y"), C("I", "x", "y")),
  // The Gutenberg Examples page drops the prime from x in the first premise.
  // The Answer and Method-of-Subscripts solution both require and print x′.
  section6Case(19, ["Some m are x′", "All m are y", "Some y are x′"], I("m", "x′"), A("m", "y"), C("I", "y", "x′")),
  section6Case(20, ["No x′ are m′", "Some m′ are y′", "Some x are y′"], E("x′", "m′"), I("m′", "y′"), C("I", "x", "y′")),
  section6Case(21, ["No m are x", "All m are y′", "Some x′ are y′"], E("m", "x"), A("m", "y′"), C("I", "x′", "y′")),
  section6Case(22, ["All x′ are m", "Some y are m′", "All x′ are y′"], A("x′", "m"), I("y", "m′"), C("A", "x′", "y′"), {
    kind: "wrong",
    correctConclusion: C("I", "x", "y"),
  }),
  section6Case(23, ["All m are x", "No m′ are y′", "No x′ are y′"], A("m", "x"), E("m′", "y′"), C("E", "x′", "y′")),
  section6Case(24, ["All x are m′", "All m′ are y", "All x are y"], A("x", "m′"), A("m′", "y"), C("A", "x", "y")),
  section6Case(25, ["No x are m′", "All m are y", "No x are y′"], E("x", "m′"), A("m", "y"), C("E", "x", "y′")),
  section6Case(26, ["All m are x′", "All y are m", "All y are x′"], A("m", "x′"), A("y", "m"), C("A", "y", "x′")),
  section6Case(27, ["All x are m", "No m are y′", "All x are y"], A("x", "m"), E("m", "y′"), C("A", "x", "y")),
  section6Case(28, ["All x are m", "No y′ are m′", "All x are y"], A("x", "m"), E("y′", "m′"), C("A", "x", "y"), LIKE),
  section6Case(29, ["No x′ are m", "No m′ are y′", "No x′ are y′"], E("x′", "m"), E("m′", "y′"), C("E", "x′", "y′")),
  section6Case(30, ["All x are m", "All m are y′", "All x are y′"], A("x", "m"), A("m", "y′"), C("A", "x", "y′")),
  section6Case(31, ["All x′ are m′", "No y′ are m′", "All x′ are y"], A("x′", "m′"), E("y′", "m′"), C("A", "x′", "y")),
  section6Case(32, ["No x are m", "No y′ are m′", "No x are y′"], E("x", "m"), E("y′", "m′"), C("E", "x", "y′")),
  section6Case(33, ["All m are x′", "All y′ are m", "All y′ are x′"], A("m", "x′"), A("y′", "m"), C("A", "y′", "x′")),
  section6Case(34, ["All x are m′", "Some y are m′", "Some y are x"], A("x", "m′"), I("y", "m′"), C("I", "y", "x"), UNLIKE),
  section6Case(35, ["Some x are m", "All m are y", "Some x are y"], I("x", "m"), A("m", "y"), C("I", "x", "y")),
  section6Case(36, ["All m are x′", "All y are m", "All y are x′"], A("m", "x′"), A("y", "m"), C("A", "y", "x′")),
  section6Case(37, ["No m are x′", "All m are y′", "Some x are y′"], E("m", "x′"), A("m", "y′"), C("I", "x", "y′")),
  section6Case(38, ["No x are m", "No m are y′", "No x are y′"], E("x", "m"), E("m", "y′"), C("E", "x", "y′"), LIKE),
  section6Case(39, ["No m are x", "Some m are y′", "Some x′ are y′"], E("m", "x"), I("m", "y′"), C("I", "x′", "y′")),
  section6Case(40, ["No m are x′", "Some y are m", "Some x are y"], E("m", "x′"), I("y", "m"), C("I", "x", "y")),
] as const satisfies readonly CarrollBookVIIISection6Case[];
