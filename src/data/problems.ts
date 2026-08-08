import type { SyllogismProblemDefinition } from "../domain/syllogism";
import { concreteTerm } from "../domain/term";

export const BUILT_IN_PROBLEMS = [
  {
    id: "barbara-aaa1",
    title: { ja: "Barbara（AAA-1）", en: "Barbara (AAA-1)" },
    premises: {
      firstPremise: { form: "A", subject: concreteTerm("animal"), predicate: concreteTerm("mortal") },
      secondPremise: { form: "A", subject: concreteTerm("human"), predicate: concreteTerm("animal") },
    },
    expectedConclusionForm: "A",
  },
  {
    id: "celarent-eae1",
    title: { ja: "Celarent（EAE-1）", en: "Celarent (EAE-1)" },
    premises: {
      firstPremise: { form: "E", subject: concreteTerm("reptile"), predicate: concreteTerm("warm-blooded") },
      secondPremise: { form: "A", subject: concreteTerm("snake"), predicate: concreteTerm("reptile") },
    },
    expectedConclusionForm: "E",
  },
  {
    id: "darii-aii1",
    title: { ja: "Darii（AII-1）", en: "Darii (AII-1)" },
    premises: {
      firstPremise: { form: "A", subject: concreteTerm("poet"), predicate: concreteTerm("writer") },
      secondPremise: { form: "I", subject: concreteTerm("student"), predicate: concreteTerm("poet") },
    },
    expectedConclusionForm: "I",
  },
  {
    id: "ferio-eio1",
    title: { ja: "Ferio（EIO-1）", en: "Ferio (EIO-1)" },
    premises: {
      firstPremise: { form: "E", subject: concreteTerm("bird"), predicate: concreteTerm("mammal") },
      secondPremise: { form: "I", subject: concreteTerm("pet"), predicate: concreteTerm("bird") },
    },
    expectedConclusionForm: "O",
  },
  {
    id: "cesare-eae2",
    title: { ja: "Cesare（EAE-2）", en: "Cesare (EAE-2)" },
    premises: {
      firstPremise: { form: "E", subject: concreteTerm("mammal"), predicate: concreteTerm("bird") },
      secondPremise: { form: "A", subject: concreteTerm("sparrow"), predicate: concreteTerm("bird") },
    },
    expectedConclusionForm: "E",
  },
  {
    id: "invalid-undistributed-middle",
    title: {
      ja: "中項不周延",
      en: "Undistributed middle",
    },
    premises: {
      firstPremise: { form: "A", subject: concreteTerm("cat"), predicate: concreteTerm("animal") },
      secondPremise: { form: "A", subject: concreteTerm("dog"), predicate: concreteTerm("animal") },
    },
    expectedConclusionForm: null,
  },
] as const satisfies readonly SyllogismProblemDefinition[];

export type BuiltInProblemId =
  (typeof BUILT_IN_PROBLEMS)[number]["id"];

export function isBuiltInProblemId(
  value: string,
): value is BuiltInProblemId {
  return BUILT_IN_PROBLEMS.some(({ id }) => id === value);
}

export function getBuiltInProblem(
  problemId: BuiltInProblemId,
): SyllogismProblemDefinition {
  const problem = BUILT_IN_PROBLEMS.find(({ id }) => id === problemId);
  if (problem === undefined) {
    throw new Error(`Unknown built-in problem: "${problemId}".`);
  }
  return problem;
}
