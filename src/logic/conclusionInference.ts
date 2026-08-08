import type {
  BiliteralCell,
  BiliteralDiagramState,
  SyllogismConclusion,
  SyllogismConclusionResult,
} from "../domain/conclusion";
import type { DiagramConstraints } from "../domain/diagram";
import {
  DEFAULT_LOGIC_SETTINGS,
  type LogicSettings,
} from "../domain/logicSettings";
import type { PropositionForm } from "../domain/proposition";
import type { AbstractSyllogism } from "../domain/syllogism";
import { abstractTerm, type AbstractTermOccurrence } from "../domain/term";
import { conclusionTermOccurrences } from "./abstraction";
import { projectToBiliteralDiagram } from "./biliteralProjection";
import { conclusionCells } from "./conclusionCells";
import { mergeConstraints } from "./constraintMerge";
import { propositionToConstraints } from "./propositionConstraints";

const CONCLUSION_FORM_ORDER = ["A", "E", "I", "O"] as const;

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

export function inferConclusionForms(
  state: BiliteralDiagramState,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
  subject: AbstractTermOccurrence = abstractTerm("S"),
  predicate: AbstractTermOccurrence = abstractTerm("P"),
): readonly PropositionForm[] {
  return CONCLUSION_FORM_ORDER.filter((form) =>
    isConclusionEntailed(
      state,
      {
        form,
        subject,
        predicate,
      },
      settings,
    ),
  );
}

export function removeRedundantConclusionForms(
  forms: readonly PropositionForm[],
): readonly PropositionForm[] {
  const uniqueForms = new Set(forms);

  if (uniqueForms.has("A")) {
    uniqueForms.delete("I");
  }

  if (uniqueForms.has("E")) {
    uniqueForms.delete("O");
  }

  return CONCLUSION_FORM_ORDER.filter((form) => uniqueForms.has(form));
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
    const conclusionTerms = conclusionTermOccurrences(premises);
    const entailedForms = inferConclusionForms(
      biliteralState,
      settings,
      conclusionTerms.subject,
      conclusionTerms.predicate,
    );

    return {
      ok: true,
      triliteralState,
      biliteralState,
      entailedForms,
      conclusionForms: removeRedundantConclusionForms(entailedForms),
    };
  } catch (error: unknown) {
    return {
      ok: false,
      stage: "constraint-merge",
      reason: errorMessage(error),
    };
  }
}
