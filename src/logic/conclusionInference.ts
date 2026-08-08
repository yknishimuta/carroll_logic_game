import type {
  BiliteralCell,
  BiliteralDiagramState,
  CompleteConclusion,
  SyllogismConclusion,
  SyllogismConclusionResult,
} from "../domain/conclusion";
import type { DiagramConstraints } from "../domain/diagram";
import {
  DEFAULT_LOGIC_SETTINGS,
  type LogicSettings,
} from "../domain/logicSettings";
import type { AbstractSyllogism } from "../domain/syllogism";
import { abstractTerm, type AbstractTermOccurrence } from "../domain/term";
import { projectToBiliteralDiagram } from "./biliteralProjection";
import { conclusionCells } from "./conclusionCells";
import { mergeConstraints } from "./constraintMerge";
import { propositionToConstraints } from "./propositionConstraints";

const CONCLUSION_FORM_ORDER = ["A", "E", "I", "O"] as const;
const ALL_SIGNED_CONCLUSION_TERM_PAIRS: readonly {
  readonly subject: AbstractTermOccurrence;
  readonly predicate: AbstractTermOccurrence;
}[] = ([
  ["S", "P"],
  ["P", "S"],
] as const).flatMap(([subjectRole, predicateRole]) =>
  ([false, true] as const).flatMap((subjectComplemented) =>
    ([false, true] as const).map((predicateComplemented) => ({
      subject: abstractTerm(subjectRole, subjectComplemented),
      predicate: abstractTerm(predicateRole, predicateComplemented),
    }))
  )
);

type ConclusionFact = `empty:${BiliteralCell}` | `existence:${BiliteralCell}`;

function conclusionFacts(
  conclusion: SyllogismConclusion,
  settings: LogicSettings,
): readonly ConclusionFact[] {
  const cells = conclusionCells(conclusion.subject, conclusion.predicate);
  switch (conclusion.form) {
    case "A":
      return settings.existentialImport === "carroll"
        ? [`empty:${cells.negative}`, `existence:${cells.positive}`]
        : [`empty:${cells.negative}`];
    case "E":
      return [`empty:${cells.positive}`];
    case "I":
      return [`existence:${cells.positive}`];
    case "O":
      return [`existence:${cells.negative}`];
  }
}

function biliteralFacts(state: BiliteralDiagramState): readonly ConclusionFact[] {
  const empty = new Set(state.emptyCells);
  return [
    ...(["SP", "Sp", "sP", "sp"] as const)
      .filter((cell) => empty.has(cell))
      .map((cell): ConclusionFact => `empty:${cell}`),
    ...(["SP", "Sp", "sP", "sp"] as const)
      .filter((cell) => hasCertainExistence(state, cell))
      .map((cell): ConclusionFact => `existence:${cell}`),
  ];
}

export function inferAllEntailedSignedPropositions(
  state: BiliteralDiagramState,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): readonly SyllogismConclusion[] {
  return ALL_SIGNED_CONCLUSION_TERM_PAIRS.flatMap((terms) =>
    CONCLUSION_FORM_ORDER.map((form): SyllogismConclusion => ({
      form,
      ...terms,
    }))
  ).filter((candidate) => isConclusionEntailed(state, candidate, settings));
}

export function inferCompleteConclusion(
  state: BiliteralDiagramState,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): CompleteConclusion | null {
  const targetFacts = biliteralFacts(state);
  if (targetFacts.length === 0) return null;
  const uncovered = new Set(targetFacts);
  const candidates = inferAllEntailedSignedPropositions(state, settings)
    .map((proposition) => ({
      proposition,
      facts: conclusionFacts(proposition, settings),
    }));
  const propositions: SyllogismConclusion[] = [];

  while (uncovered.size > 0) {
    const selected = candidates.reduce<(typeof candidates)[number] | null>(
      (best, candidate) => {
        const coverage = candidate.facts.filter((fact) => uncovered.has(fact))
          .length;
        if (coverage === 0) return best;
        if (best === null) return candidate;
        const bestCoverage = best.facts.filter((fact) => uncovered.has(fact))
          .length;
        if (coverage !== bestCoverage) {
          return coverage > bestCoverage ? candidate : best;
        }
        return candidate.facts.length > best.facts.length ? candidate : best;
      },
      null,
    );
    if (selected === null) {
      throw new Error(
        `Complete conclusion cannot represent facts: ${[...uncovered].join(", ")}.`,
      );
    }
    propositions.push(selected.proposition);
    for (const fact of selected.facts) uncovered.delete(fact);
  }

  return {
    biliteralState: state,
    propositions,
  };
}

function hasCertainExistence(
  state: BiliteralDiagramState,
  cell: BiliteralCell,
): boolean {
  return state.existentials.some(
    (existential) =>
      existential.possibleCells.length === 1 &&
      existential.possibleCells[0] === cell,
  );
}

export function isConclusionEntailed(
  state: BiliteralDiagramState,
  conclusion: SyllogismConclusion,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): boolean {
  const emptyCells = new Set(state.emptyCells);
  const cells = conclusionCells(conclusion.subject, conclusion.predicate);

  switch (conclusion.form) {
    case "A":
      return (
        emptyCells.has(cells.negative) &&
        (settings.existentialImport === "modern" ||
          hasCertainExistence(state, cells.positive))
      );
    case "E":
      return emptyCells.has(cells.positive);
    case "I":
      return hasCertainExistence(state, cells.positive);
    case "O":
      return hasCertainExistence(state, cells.negative);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function inferSyllogismConclusion(
  premises: AbstractSyllogism,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): SyllogismConclusionResult {
  let firstConstraints: DiagramConstraints;
  let secondConstraints: DiagramConstraints;

  try {
    firstConstraints = propositionToConstraints(
      premises.firstPremise,
      "first-premise",
      settings,
    );
    secondConstraints = propositionToConstraints(
      premises.secondPremise,
      "second-premise",
      settings,
    );
  } catch (error: unknown) {
    return {
      ok: false,
      stage: "proposition-compilation",
      reason: errorMessage(error),
    };
  }

  try {
    const triliteralState = mergeConstraints([
      firstConstraints,
      secondConstraints,
    ]);
    const biliteralState = projectToBiliteralDiagram(triliteralState);
    const completeConclusion = inferCompleteConclusion(
      biliteralState,
      settings,
    );

    return {
      ok: true,
      triliteralState,
      biliteralState,
      completeConclusion,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      stage: "constraint-merge",
      reason: errorMessage(error),
    };
  }
}
