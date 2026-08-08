import type { LogicSettings } from "../../src/domain/logicSettings";
import type {
  AbstractProposition,
  PropositionForm,
} from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import type { AbstractTermOccurrence } from "../../src/domain/term";

export interface SemanticCell {
  readonly S: boolean;
  readonly M: boolean;
  readonly P: boolean;
}

const SEMANTIC_CELLS: readonly SemanticCell[] = [
  { S: true, M: true, P: true },
  { S: true, M: true, P: false },
  { S: true, M: false, P: true },
  { S: true, M: false, P: false },
  { S: false, M: true, P: true },
  { S: false, M: true, P: false },
  { S: false, M: false, P: true },
  { S: false, M: false, P: false },
];

export type SemanticModel = readonly boolean[];

export const ALL_SEMANTIC_MODELS: readonly SemanticModel[] = Array.from(
  { length: 256 },
  (_, modelNumber) =>
    SEMANTIC_CELLS.map(
      (_, cellIndex) => (modelNumber & (1 << cellIndex)) !== 0,
    ),
);

function hasObject(
  model: SemanticModel,
  predicate: (cell: SemanticCell) => boolean,
): boolean {
  return SEMANTIC_CELLS.some(
    (cell, index) => model[index] === true && predicate(cell),
  );
}

function belongs(
  cell: SemanticCell,
  occurrence: AbstractProposition["subject"],
): boolean {
  const base = cell[occurrence.role];
  return occurrence.complemented ? !base : base;
}

export function oraclePropositionIsTrue(
  model: SemanticModel,
  proposition: AbstractProposition,
  settings: LogicSettings,
): boolean {
  const subjectAndPredicate = (cell: SemanticCell) =>
    belongs(cell, proposition.subject) &&
    belongs(cell, proposition.predicate);
  const subjectAndNotPredicate = (cell: SemanticCell) =>
    belongs(cell, proposition.subject) &&
    !belongs(cell, proposition.predicate);

  switch (proposition.form) {
    case "A":
      return (
        !hasObject(model, subjectAndNotPredicate) &&
        (settings.existentialImport === "modern" ||
          hasObject(model, subjectAndPredicate))
      );
    case "E":
      return !hasObject(model, subjectAndPredicate);
    case "I":
      return hasObject(model, subjectAndPredicate);
    case "O":
      return hasObject(model, subjectAndNotPredicate);
  }
}

export function oracleConclusionIsEntailed(
  premises: AbstractSyllogism,
  conclusion: AbstractProposition,
  settings: LogicSettings,
): boolean | null {
  const satisfyingModels = oracleSatisfyingModels(premises, settings);
  return satisfyingModels.length === 0
    ? null
    : satisfyingModels.every((model) =>
        oraclePropositionIsTrue(model, conclusion, settings)
      );
}

export function oracleEntailedForms(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): readonly PropositionForm[] | null {
  const satisfyingModels = oracleSatisfyingModels(premises, settings);

  if (satisfyingModels.length === 0) {
    return null;
  }

  const forms = ["A", "E", "I", "O"] as const;
  const pairs: readonly {
    readonly subject: AbstractTermOccurrence;
    readonly predicate: AbstractTermOccurrence;
  }[] = [
    { subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: false } },
    { subject: { role: "S", complemented: true }, predicate: { role: "P", complemented: false } },
    { subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: true } },
    { subject: { role: "S", complemented: true }, predicate: { role: "P", complemented: true } },
  ];
  const entails = (
    form: PropositionForm,
    terms: (typeof pairs)[number],
  ): boolean => satisfyingModels.every((model) =>
    oraclePropositionIsTrue(model, { form, ...terms }, settings)
  );
  const preferredSubject = [
    premises.secondPremise.subject,
    premises.secondPremise.predicate,
  ].find(({ role }) => role === "S");
  const preferredPredicate = [
    premises.firstPremise.subject,
    premises.firstPremise.predicate,
  ].find(({ role }) => role === "P");
  if (preferredSubject === undefined || preferredPredicate === undefined) {
    throw new Error("The semantic oracle requires retained S and P terms.");
  }
  const orderedPairs = [
    { subject: preferredSubject, predicate: preferredPredicate },
    ...pairs.filter((terms) =>
      terms.subject.complemented !== preferredSubject.complemented ||
      terms.predicate.complemented !== preferredPredicate.complemented
    ),
  ];
  for (const terms of orderedPairs) {
    for (const form of forms) {
      if (entails(form, terms)) {
        return forms.filter((candidateForm) => entails(candidateForm, terms));
      }
    }
  }
  return [];
}

export function oracleSatisfyingModels(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): readonly SemanticModel[] {
  return ALL_SEMANTIC_MODELS.filter(
    (model) =>
      oraclePropositionIsTrue(model, premises.firstPremise, settings) &&
      oraclePropositionIsTrue(model, premises.secondPremise, settings),
  );
}

export function oracleFindCountermodel(
  premises: AbstractSyllogism,
  conclusion: AbstractProposition,
  settings: LogicSettings,
): SemanticModel | null {
  return oracleSatisfyingModels(premises, settings).find((model) =>
    !oraclePropositionIsTrue(model, conclusion, settings)
  ) ?? null;
}

export function formatSemanticModel(model: SemanticModel): string {
  return SEMANTIC_CELLS.map((cell, index) => {
    const name = `${cell.S ? "S" : "s"}${cell.M ? "M" : "m"}${cell.P ? "P" : "p"}`;
    return `${name}=${model[index] === true ? "occupied" : "empty"}`;
  }).join(", ");
}
