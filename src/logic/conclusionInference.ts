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
import { projectToBiliteralDiagram } from "./biliteralProjection";
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

  switch (conclusion.form) {
    case "A":
      return (
        emptyCells.has("Sp") &&
        (settings.existentialImport === "modern" ||
          hasCertainExistence(state, "SP"))
      );
    case "E":
      return emptyCells.has("SP");
    case "I":
      return hasCertainExistence(state, "SP");
    case "O":
      return hasCertainExistence(state, "Sp");
  }
}

export function inferConclusionForms(
  state: BiliteralDiagramState,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): readonly PropositionForm[] {
  return CONCLUSION_FORM_ORDER.filter((form) =>
    isConclusionEntailed(
      state,
      {
        form,
        subjectRole: "S",
        predicateRole: "P",
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
    const entailedForms = inferConclusionForms(
      biliteralState,
      settings,
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
