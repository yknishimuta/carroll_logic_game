import type { SyllogismConclusion } from "../../src/domain/conclusion";
import type { AbstractProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import {
  carrollConclusion,
  carrollProposition,
  carrollSource,
  carrollSyllogism,
  type CarrollSourceMetadata,
} from "../helpers/carrollBookVIII";

export type CarrollFallacy =
  | "like-eliminands-not-asserted-to-exist"
  | "unlike-eliminands-with-entity-premiss";

export type CarrollSection4Expected =
  | {
      readonly kind: "conclusion";
      readonly sourceAnswerText: string;
      readonly conclusions: readonly SyllogismConclusion[];
    }
  | {
      readonly kind: "no-conclusion";
      readonly sourceAnswerText: "No Concl.";
      readonly fallacy: CarrollFallacy;
    };

export interface CarrollBookVIIISection4Case {
  readonly section: 4;
  readonly number: number;
  readonly source: CarrollSourceMetadata;
  readonly sourceText: readonly [string, string];
  readonly premises: AbstractSyllogism;
  readonly expected: CarrollSection4Expected;
}

const A = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("A", subject, predicate);
const E = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("E", subject, predicate);
const I = (subject: Parameters<typeof carrollProposition>[1], predicate: Parameters<typeof carrollProposition>[2]): AbstractProposition =>
  carrollProposition("I", subject, predicate);
const C = carrollConclusion;

function conclusion(
  sourceAnswerText: string,
  ...conclusions: readonly SyllogismConclusion[]
): CarrollSection4Expected {
  return { kind: "conclusion", sourceAnswerText, conclusions };
}

function noConclusion(fallacy: CarrollFallacy): CarrollSection4Expected {
  return { kind: "no-conclusion", sourceAnswerText: "No Concl.", fallacy };
}

function section4Case(
  number: number,
  sourceText: readonly [string, string],
  xPremise: AbstractProposition,
  yPremise: AbstractProposition,
  expected: CarrollSection4Expected,
): CarrollBookVIIISection4Case {
  return {
    section: 4,
    number,
    source: carrollSource(4, number),
    sourceText,
    // The source prints the x–m proposition first. The app's syllogism model
    // stores the P-bearing major premise first and the S-bearing minor second;
    // with x → S and y → P, that requires this test-only reordering.
    premises: carrollSyllogism(yPremise, xPremise),
    expected,
  };
}

// The answer text and no-conclusion classifications are fixed transcriptions
// from Book VIII, Chapter II, “Answers to § 4” (printed pages 127–128).
// Conclusions retain Carroll's own subject/predicate orientation. This matters
// under his existential import: converting an A proposition can discard a
// separate existence assertion even when the empty-quarter condition matches.
export const CARROLL_BOOK_VIII_SECTION_4 = [
  section4Case(1, ["No m are x′", "All m′ are y"], E("m", "x′"), A("m′", "y"),
    conclusion("No x′ are y′", C("E", "x′", "y′"))),
  section4Case(2, ["No m′ are x", "Some m′ are y′"], E("m′", "x"), I("m′", "y′"),
    conclusion("Some x′ are y′", C("I", "x′", "y′"))),
  section4Case(3, ["All m′ are x", "All m′ are y′"], A("m′", "x"), A("m′", "y′"),
    conclusion("Some x are y′", C("I", "x", "y′"))),
  section4Case(4, ["No x′ are m′", "All y′ are m"], E("x′", "m′"), A("y′", "m"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(5, ["Some m are x′", "No y are m"], I("m", "x′"), E("y", "m"),
    conclusion("Some x′ are y′", C("I", "x′", "y′"))),
  section4Case(6, ["No x′ are m", "No m are y"], E("x′", "m"), E("m", "y"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(7, ["No m are x′", "Some y′ are m"], E("m", "x′"), I("y′", "m"),
    conclusion("Some x are y′", C("I", "x", "y′"))),
  section4Case(8, ["All m′ are x′", "No m′ are y"], A("m′", "x′"), E("m′", "y"),
    conclusion("Some x′ are y′", C("I", "x′", "y′"))),
  section4Case(9, ["Some x′ are m′", "No m are y′"], I("x′", "m′"), E("m", "y′"),
    noConclusion("unlike-eliminands-with-entity-premiss")),
  section4Case(10, ["All x are m", "All y′ are m′"], A("x", "m"), A("y′", "m′"),
    conclusion("All x are y, and all y′ are x′", C("A", "x", "y"), C("A", "y′", "x′"))),
  section4Case(11, ["No m are x", "All y′ are m′"], E("m", "x"), A("y′", "m′"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(12, ["No x are m", "All y are m"], E("x", "m"), A("y", "m"),
    conclusion("All y are x′", C("A", "y", "x′"))),
  section4Case(13, ["All m′ are x", "No y are m"], A("m′", "x"), E("y", "m"),
    conclusion("No x′ are y", C("E", "x′", "y"))),
  section4Case(14, ["All m are x", "All m′ are y"], A("m", "x"), A("m′", "y"),
    conclusion("No x′ are y′", C("E", "x′", "y′"))),
  section4Case(15, ["No x are m", "No m′ are y"], E("x", "m"), E("m′", "y"),
    conclusion("No x are y", C("E", "x", "y"))),
  section4Case(16, ["All x are m′", "All y are m"], A("x", "m′"), A("y", "m"),
    conclusion("All x are y′, and all y are x′", C("A", "x", "y′"), C("A", "y", "x′"))),
  section4Case(17, ["No x are m", "All m′ are y"], E("x", "m"), A("m′", "y"),
    conclusion("No x are y′", C("E", "x", "y′"))),
  section4Case(18, ["No x are m′", "No m are y"], E("x", "m′"), E("m", "y"),
    conclusion("No x are y", C("E", "x", "y"))),
  section4Case(19, ["All m are x", "All m are y′"], A("m", "x"), A("m", "y′"),
    conclusion("Some x are y′", C("I", "x", "y′"))),
  section4Case(20, ["No m are x", "All m′ are y"], E("m", "x"), A("m′", "y"),
    conclusion("No x are y′", C("E", "x", "y′"))),
  section4Case(21, ["All x are m", "Some m′ are y"], A("x", "m"), I("m′", "y"),
    conclusion("Some y are x′", C("I", "y", "x′"))),
  section4Case(22, ["Some x are m", "All y are m"], I("x", "m"), A("y", "m"),
    noConclusion("unlike-eliminands-with-entity-premiss")),
  section4Case(23, ["All m are x", "Some y are m"], A("m", "x"), I("y", "m"),
    conclusion("Some x are y", C("I", "x", "y"))),
  section4Case(24, ["No x are m", "All y are m"], E("x", "m"), A("y", "m"),
    conclusion("All y are x′", C("A", "y", "x′"))),
  section4Case(25, ["Some m are x′", "All y′ are m′"], I("m", "x′"), A("y′", "m′"),
    conclusion("Some y are x′", C("I", "y", "x′"))),
  section4Case(26, ["No m are x′", "All y are m"], E("m", "x′"), A("y", "m"),
    conclusion("All y are x", C("A", "y", "x"))),
  section4Case(27, ["All x are m′", "All y′ are m"], A("x", "m′"), A("y′", "m"),
    conclusion("All x are y, and all y′ are x′", C("A", "x", "y"), C("A", "y′", "x′"))),
  section4Case(28, ["All m are x′", "Some m are y"], A("m", "x′"), I("m", "y"),
    conclusion("Some y are x′", C("I", "y", "x′"))),
  section4Case(29, ["No m are x", "All y are m′"], E("m", "x"), A("y", "m′"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(30, ["All x are m′", "Some y are m"], A("x", "m′"), I("y", "m"),
    conclusion("Some y are x′", C("I", "y", "x′"))),
  section4Case(31, ["All x are m", "All y are m"], A("x", "m"), A("y", "m"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(32, ["No x are m′", "All m are y"], E("x", "m′"), A("m", "y"),
    conclusion("No x are y′", C("E", "x", "y′"))),
  section4Case(33, ["No m are x", "No m are y"], E("m", "x"), E("m", "y"),
    noConclusion("like-eliminands-not-asserted-to-exist")),
  section4Case(34, ["No m are x′", "Some y are m"], E("m", "x′"), I("y", "m"),
    conclusion("Some x are y", C("I", "x", "y"))),
  section4Case(35, ["No m are x", "All y are m"], E("m", "x"), A("y", "m"),
    conclusion("All y are x′", C("A", "y", "x′"))),
  section4Case(36, ["All m are x′", "Some y are m"], A("m", "x′"), I("y", "m"),
    conclusion("Some y are x′", C("I", "y", "x′"))),
  section4Case(37, ["All m are x", "No y are m"], A("m", "x"), E("y", "m"),
    conclusion("Some x are y′", C("I", "x", "y′"))),
  section4Case(38, ["No m are x", "No m′ are y"], E("m", "x"), E("m′", "y"),
    conclusion("No x are y", C("E", "x", "y"))),
  section4Case(39, ["Some m are x′", "No m are y"], I("m", "x′"), E("m", "y"),
    conclusion("Some x′ are y′", C("I", "x′", "y′"))),
  section4Case(40, ["No x′ are m", "All y′ are m"], E("x′", "m"), A("y′", "m"),
    conclusion("All y′ are x", C("A", "y′", "x"))),
  section4Case(41, ["All x are m′", "No y are m′"], A("x", "m′"), E("y", "m′"),
    conclusion("All x are y′", C("A", "x", "y′"))),
  section4Case(42, ["No m′ are x", "No y are m"], E("m′", "x"), E("y", "m"),
    conclusion("No x are y", C("E", "x", "y"))),
] as const satisfies readonly CarrollBookVIIISection4Case[];
