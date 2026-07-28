import type { LogicSettings } from "../../src/domain/logicSettings";
import type {
  AbstractProposition,
  PropositionForm,
} from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import type { TermRole } from "../../src/domain/term";

interface SemanticCell {
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

type SemanticModel = readonly boolean[];

function allModels(): readonly SemanticModel[] {
  return Array.from({ length: 256 }, (_, modelNumber) =>
    SEMANTIC_CELLS.map(
      (_, cellIndex) => (modelNumber & (1 << cellIndex)) !== 0,
    ),
  );
}

function hasObject(
  model: SemanticModel,
  predicate: (cell: SemanticCell) => boolean,
): boolean {
  return SEMANTIC_CELLS.some(
    (cell, index) => model[index] === true && predicate(cell),
  );
}

function belongs(cell: SemanticCell, role: TermRole): boolean {
  return cell[role];
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

export function oracleEntailedForms(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): readonly PropositionForm[] | null {
  const satisfyingModels = allModels().filter(
    (model) =>
      oraclePropositionIsTrue(model, premises.firstPremise, settings) &&
      oraclePropositionIsTrue(model, premises.secondPremise, settings),
  );

  if (satisfyingModels.length === 0) {
    return null;
  }

  const forms = ["A", "E", "I", "O"] as const;

  return forms.filter((form) =>
    satisfyingModels.every((model) =>
      oraclePropositionIsTrue(
        model,
        {
          form,
          subject: "S",
          predicate: "P",
        },
        settings,
      ),
    ),
  );
}
