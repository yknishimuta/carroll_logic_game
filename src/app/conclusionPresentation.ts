import type { CompleteConclusion } from "../domain/conclusion";
import type { LogicSettings } from "../domain/logicSettings";
import type {
  AbstractProposition,
  PropositionForm,
} from "../domain/proposition";
import type { AbstractSyllogism } from "../domain/syllogism";
import { abstractTerm, type TermRole } from "../domain/term";
import {
  biliteralSemanticFacts,
  conclusionSemanticFacts,
  inferAllEntailedSignedPropositions,
  isConclusionEntailed,
} from "../logic/conclusionInference";

const TRADITIONAL_PRESENTATION_FORM_PRIORITY = [
  "A",
  "E",
  "I",
  "O",
] as const satisfies readonly PropositionForm[];

/** Structured propositions selected for user-facing conclusion text and quiz. */
export interface ConclusionPresentation {
  readonly propositions: readonly AbstractProposition[];
}

function complementCount(proposition: AbstractProposition): number {
  return Number(proposition.subject.complemented) +
    Number(proposition.predicate.complemented);
}

function isReverseOrientation(proposition: AbstractProposition): boolean {
  return proposition.subject.role === "P";
}

function formRank(form: PropositionForm): number {
  return TRADITIONAL_PRESENTATION_FORM_PRIORITY.indexOf(form);
}

function structuralKey(proposition: AbstractProposition): string {
  return [
    proposition.subject.role,
    Number(proposition.subject.complemented),
    proposition.predicate.role,
    Number(proposition.predicate.complemented),
    proposition.form,
  ].join(":");
}

function compareStructuralKeys(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function comparePresentationPropositions(
  left: AbstractProposition,
  right: AbstractProposition,
): number {
  const scalarComparisons = [
    complementCount(left) - complementCount(right),
    Number(isReverseOrientation(left)) - Number(isReverseOrientation(right)),
    Number(left.subject.complemented) - Number(right.subject.complemented),
    formRank(left.form) - formRank(right.form),
  ];
  for (const comparison of scalarComparisons) {
    if (comparison !== 0) return comparison;
  }
  return compareStructuralKeys(structuralKey(left), structuralKey(right));
}

function orderedBasis(
  propositions: readonly AbstractProposition[],
): readonly AbstractProposition[] {
  return [...propositions].sort(comparePresentationPropositions);
}

export function comparePresentationBases(
  left: readonly AbstractProposition[],
  right: readonly AbstractProposition[],
): number {
  const scalarComparisons = [
    left.length - right.length,
    left.reduce((total, proposition) => total + complementCount(proposition), 0) -
      right.reduce((total, proposition) => total + complementCount(proposition), 0),
    left.filter(isReverseOrientation).length -
      right.filter(isReverseOrientation).length,
    left.filter(({ subject }) => subject.complemented).length -
      right.filter(({ subject }) => subject.complemented).length,
  ];
  for (const comparison of scalarComparisons) {
    if (comparison !== 0) return comparison;
  }

  const orderedLeft = orderedBasis(left);
  const orderedRight = orderedBasis(right);
  for (let index = 0; index < orderedLeft.length; index += 1) {
    const leftProposition = orderedLeft[index];
    const rightProposition = orderedRight[index];
    if (leftProposition === undefined || rightProposition === undefined) break;
    const formComparison = formRank(leftProposition.form) -
      formRank(rightProposition.form);
    if (formComparison !== 0) return formComparison;
  }
  return compareStructuralKeys(
    orderedLeft.map(structuralKey).join("|"),
    orderedRight.map(structuralKey).join("|"),
  );
}

function propositionHasRoles(
  proposition: AbstractProposition,
  firstRole: TermRole,
  secondRole: TermRole,
): boolean {
  const roles = [proposition.subject.role, proposition.predicate.role];
  return roles.includes(firstRole) && roles.includes(secondRole);
}

function isTraditionalUncomplementedSyllogism(
  premises: AbstractSyllogism,
): boolean {
  const propositions = [premises.firstPremise, premises.secondPremise];
  return propositions.every(({ subject, predicate }) =>
      !subject.complemented && !predicate.complemented
    ) &&
    propositionHasRoles(premises.firstPremise, "M", "P") &&
    propositionHasRoles(premises.secondPremise, "S", "M");
}

function tryBuildTraditionalPresentation(
  completeConclusion: CompleteConclusion,
  premises: AbstractSyllogism,
  settings: LogicSettings,
): ConclusionPresentation | null {
  if (!isTraditionalUncomplementedSyllogism(premises)) return null;
  for (const form of TRADITIONAL_PRESENTATION_FORM_PRIORITY) {
    const proposition: AbstractProposition = {
      form,
      subject: abstractTerm("S"),
      predicate: abstractTerm("P"),
    };
    if (isConclusionEntailed(
      completeConclusion.biliteralState,
      proposition,
      settings,
    )) return { propositions: [proposition] };
  }
  return null;
}

export function buildCanonicalCompletePresentation(
  completeConclusion: CompleteConclusion,
  settings: LogicSettings,
): ConclusionPresentation {
  const targetFacts = biliteralSemanticFacts(completeConclusion.biliteralState);
  const factBits = new Map(
    targetFacts.map((fact, index) => [fact, 2 ** index] as const),
  );
  const candidates = inferAllEntailedSignedPropositions(
    completeConclusion.biliteralState,
    settings,
  ).map((proposition) => ({
    proposition,
    coverage: conclusionSemanticFacts(proposition, settings).reduce(
      (mask, fact) => mask | (factBits.get(fact) ?? 0),
      0,
    ),
  })).filter(({ coverage }) => coverage !== 0);
  const fullCoverage = (2 ** targetFacts.length) - 1;
  const bestByCoverage = new Map<number, readonly AbstractProposition[]>([
    [0, []],
  ]);

  for (const candidate of candidates) {
    for (const [covered, basis] of [...bestByCoverage]) {
      const nextCoverage = covered | candidate.coverage;
      const nextBasis = orderedBasis([...basis, candidate.proposition]);
      const current = bestByCoverage.get(nextCoverage);
      if (current === undefined || comparePresentationBases(nextBasis, current) < 0) {
        bestByCoverage.set(nextCoverage, nextBasis);
      }
    }
  }

  return {
    propositions: bestByCoverage.get(fullCoverage) ??
      [...completeConclusion.propositions],
  };
}

export function buildConclusionPresentation(
  completeConclusion: CompleteConclusion | null,
  premises: AbstractSyllogism,
  settings: LogicSettings,
): ConclusionPresentation | null {
  if (completeConclusion === null) return null;
  return tryBuildTraditionalPresentation(completeConclusion, premises, settings) ??
    buildCanonicalCompletePresentation(completeConclusion, settings);
}
