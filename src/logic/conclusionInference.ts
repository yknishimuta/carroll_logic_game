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
import { projectToBiliteralDiagram } from "./biliteralProjection";
import { conclusionCells } from "./conclusionCells";
import { mergeConstraints } from "./constraintMerge";
import { propositionToConstraints } from "./propositionConstraints";

const CONCLUSION_FORM_ORDER = ["A", "E", "I", "O"] as const;
const CONCLUSION_TERM_PAIRS: readonly {
  readonly subject: AbstractTermOccurrence;
  readonly predicate: AbstractTermOccurrence;
}[] = [
  { subject: abstractTerm("S"), predicate: abstractTerm("P") },
  {
    subject: abstractTerm("S", true),
    predicate: abstractTerm("P"),
  },
  {
    subject: abstractTerm("S"),
    predicate: abstractTerm("P", true),
  },
  {
    subject: abstractTerm("S", true),
    predicate: abstractTerm("P", true),
  },
];

function preferredConclusionTerms(
  premises: AbstractSyllogism,
): (typeof CONCLUSION_TERM_PAIRS)[number] {
  const subject = [
    premises.secondPremise.subject,
    premises.secondPremise.predicate,
  ].find(({ role }) => role === "S");
  const predicate = [
    premises.firstPremise.subject,
    premises.firstPremise.predicate,
  ].find(({ role }) => role === "P");
  if (subject === undefined || predicate === undefined) {
    throw new Error("The retained conclusion terms could not be determined.");
  }
  return { subject, predicate };
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

export function inferConclusionFromBiliteralState(
  state: BiliteralDiagramState,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
  preferredTerms?: (typeof CONCLUSION_TERM_PAIRS)[number],
): {
  readonly conclusion: SyllogismConclusion | null;
  readonly entailedForms: readonly PropositionForm[];
  readonly conclusionForms: readonly PropositionForm[];
} {
  const termPairs = preferredTerms === undefined
    ? CONCLUSION_TERM_PAIRS
    : [
        preferredTerms,
        ...CONCLUSION_TERM_PAIRS.filter((terms) =>
          terms.subject.complemented !== preferredTerms.subject.complemented ||
          terms.predicate.complemented !== preferredTerms.predicate.complemented
        ),
      ];
  for (const terms of termPairs) {
    for (const form of CONCLUSION_FORM_ORDER) {
      const candidate: SyllogismConclusion = { form, ...terms };
      if (!isConclusionEntailed(state, candidate, settings)) continue;
      const entailedForms = inferConclusionForms(
        state,
        settings,
        terms.subject,
        terms.predicate,
      );
      const conclusionForms = removeRedundantConclusionForms(entailedForms);
      const conclusionForm = conclusionForms[0];
      return {
        conclusion: conclusionForm === undefined
          ? null
          : { form: conclusionForm, ...terms },
        entailedForms,
        conclusionForms,
      };
    }
  }
  return { conclusion: null, entailedForms: [], conclusionForms: [] };
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
    const inference = inferConclusionFromBiliteralState(
      biliteralState,
      settings,
      preferredConclusionTerms(premises),
    );

    return {
      ok: true,
      triliteralState,
      biliteralState,
      ...inference,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      stage: "constraint-merge",
      reason: errorMessage(error),
    };
  }
}
