import type { SyllogismProblemDefinition } from "../domain/syllogism";

export const BUILT_IN_PROBLEMS = [
  {
    id: "barbara-aaa1",
    title: { ja: "Barbara（AAA-1）", en: "Barbara (AAA-1)" },
    premises: {
      firstPremise: { form: "A", subject: "animal", predicate: "mortal" },
      secondPremise: { form: "A", subject: "human", predicate: "animal" },
    },
    expectedConclusionForm: "A",
  },
  {
    id: "celarent-eae1",
    title: { ja: "Celarent（EAE-1）", en: "Celarent (EAE-1)" },
    premises: {
      firstPremise: { form: "E", subject: "reptile", predicate: "warm-blooded" },
      secondPremise: { form: "A", subject: "snake", predicate: "reptile" },
    },
    expectedConclusionForm: "E",
  },
  {
    id: "darii-aii1",
    title: { ja: "Darii（AII-1）", en: "Darii (AII-1)" },
    premises: {
      firstPremise: { form: "A", subject: "poet", predicate: "writer" },
      secondPremise: { form: "I", subject: "student", predicate: "poet" },
    },
    expectedConclusionForm: "I",
  },
  {
    id: "ferio-eio1",
    title: { ja: "Ferio（EIO-1）", en: "Ferio (EIO-1)" },
    premises: {
      firstPremise: { form: "E", subject: "bird", predicate: "mammal" },
      secondPremise: { form: "I", subject: "pet", predicate: "bird" },
    },
    expectedConclusionForm: "O",
  },
  {
    id: "cesare-eae2",
    title: { ja: "Cesare（EAE-2）", en: "Cesare (EAE-2)" },
    premises: {
      firstPremise: { form: "E", subject: "mammal", predicate: "bird" },
      secondPremise: { form: "A", subject: "sparrow", predicate: "bird" },
    },
    expectedConclusionForm: "E",
  },
  {
    id: "invalid-undistributed-middle",
    title: {
      ja: "中項不周延（無効）",
      en: "Undistributed middle (invalid)",
    },
    premises: {
      firstPremise: { form: "A", subject: "cat", predicate: "animal" },
      secondPremise: { form: "A", subject: "dog", predicate: "animal" },
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
