import { describe, expect, it } from "vitest";
import {
  buildConclusionPresentation,
  type ConclusionPresentation,
} from "../src/app/conclusionPresentation";
import type {
  BiliteralCell,
  BiliteralDiagramState,
} from "../src/domain/conclusion";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractProposition } from "../src/domain/proposition";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import { abstractTerm } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import {
  ABSTRACT_PREMISE_PAIRS,
  MP_VARIANTS,
  premisePairId,
  propositionId,
  SIGNED_RETINEND_CANDIDATES,
  SM_VARIANTS,
} from "./helpers/abstractSyllogismUniverse";
import {
  complementRoleEverywhere,
  complementRoleInProposition,
  contraposeModernA,
  rewriteIComplementAsO,
  rewriteModernAAsEComplement,
  rewriteModernEComplementAsA,
  rewriteOAsIComplement,
  swapEOrIArguments,
  toggleOccurrenceComplement,
} from "./helpers/propositionMetamorphisms";
import {
  ALL_SEMANTIC_MODELS,
  formatSemanticModel,
  oracleComplementRoleModel,
  oraclePropositionIsTrue,
  oracleRetainedModelMask,
} from "./helpers/semanticOracle";

const SETTINGS = [
  { existentialImport: "carroll" as const },
  { existentialImport: "modern" as const },
] satisfies readonly LogicSettings[];

type PropositionTransform = (
  proposition: AbstractProposition,
) => AbstractProposition | null;

interface ProductionObservation {
  readonly ok: boolean;
  readonly complete: boolean;
  readonly biliteralState: BiliteralDiagramState | null;
  readonly semanticBasis: readonly string[] | null;
  readonly presentation: ConclusionPresentation | null;
  readonly retainedModels: readonly number[];
}

const observationCache = new Map<string, ProductionObservation>();

function propositionTruthMask(
  proposition: AbstractProposition,
  settings: LogicSettings,
): bigint {
  return ALL_SEMANTIC_MODELS.reduce(
    (mask, model, index) =>
      oraclePropositionIsTrue(model, proposition, settings)
        ? mask | (1n << BigInt(index))
        : mask,
    0n,
  );
}

function oracleRetainedModels(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): readonly number[] {
  return [...new Set(ALL_SEMANTIC_MODELS.filter((model) =>
    oraclePropositionIsTrue(model, premises.firstPremise, settings) &&
    oraclePropositionIsTrue(model, premises.secondPremise, settings)
  ).map(oracleRetainedModelMask))].sort((left, right) => left - right);
}

function observe(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): ProductionObservation {
  const cacheKey = `${settings.existentialImport}:${premisePairId(premises)}`;
  const cached = observationCache.get(cacheKey);
  if (cached !== undefined) return cached;
  const result = inferSyllogismConclusion(premises, settings);
  if (!result.ok) {
    const observation: ProductionObservation = {
      ok: false,
      complete: false,
      biliteralState: null,
      semanticBasis: null,
      presentation: null,
      retainedModels: oracleRetainedModels(premises, settings),
    };
    observationCache.set(cacheKey, observation);
    return observation;
  }
  const observation: ProductionObservation = {
    ok: true,
    complete: result.completeConclusion !== null,
    biliteralState: result.completeConclusion?.biliteralState ?? null,
    semanticBasis: result.completeConclusion?.propositions.map(propositionId) ?? null,
    presentation: buildConclusionPresentation(
      result.completeConclusion,
      premises,
      settings,
    ),
    retainedModels: oracleRetainedModels(premises, settings),
  };
  observationCache.set(cacheKey, observation);
  return observation;
}

function presentationIds(
  presentation: ConclusionPresentation | null,
): readonly string[] | null {
  return presentation?.propositions.map(propositionId) ?? null;
}

function diagnostic(
  transformation: string,
  settings: LogicSettings,
  original: AbstractSyllogism,
  transformed: AbstractSyllogism,
  originalResult: ProductionObservation,
  transformedResult: ProductionObservation,
): string {
  return [
    `mode=${settings.existentialImport}`,
    `transform=${transformation}`,
    `original=${premisePairId(original)}`,
    `transformed=${premisePairId(transformed)}`,
    `originalState=${JSON.stringify(originalResult.biliteralState)}`,
    `transformedState=${JSON.stringify(transformedResult.biliteralState)}`,
    `originalPresentation=${JSON.stringify(presentationIds(originalResult.presentation))}`,
    `transformedPresentation=${JSON.stringify(presentationIds(transformedResult.presentation))}`,
  ].join("; ");
}

function assertPresentationSound(
  premises: AbstractSyllogism,
  settings: LogicSettings,
  observation: ProductionObservation,
  context: string,
): void {
  const satisfyingModels = ALL_SEMANTIC_MODELS.filter((model) =>
    oraclePropositionIsTrue(model, premises.firstPremise, settings) &&
    oraclePropositionIsTrue(model, premises.secondPremise, settings)
  );
  for (const proposition of observation.presentation?.propositions ?? []) {
    expect(
      satisfyingModels.every((model) =>
        oraclePropositionIsTrue(model, proposition, settings)
      ),
      `${context}; unsound=${propositionId(proposition)}`,
    ).toBe(true);
  }
}

function assertSemanticInvariant(
  transformation: string,
  settings: LogicSettings,
  original: AbstractSyllogism,
  transformed: AbstractSyllogism,
  exactPresentation: boolean,
): void {
  const originalResult = observe(original, settings);
  const transformedResult = observe(transformed, settings);
  const context = diagnostic(
    transformation,
    settings,
    original,
    transformed,
    originalResult,
    transformedResult,
  );
  expect(transformedResult.ok, context).toBe(originalResult.ok);
  expect(transformedResult.complete, context).toBe(originalResult.complete);
  expect(transformedResult.retainedModels, context).toEqual(originalResult.retainedModels);
  expect(transformedResult.biliteralState, context).toEqual(originalResult.biliteralState);
  expect(transformedResult.semanticBasis, context).toEqual(originalResult.semanticBasis);
  if (exactPresentation) {
    expect(presentationIds(transformedResult.presentation), context)
      .toEqual(presentationIds(originalResult.presentation));
  }
  assertPresentationSound(original, settings, originalResult, context);
  assertPresentationSound(transformed, settings, transformedResult, context);
}

function replacePremise(
  premises: AbstractSyllogism,
  position: "first" | "second",
  proposition: AbstractProposition,
): AbstractSyllogism {
  return position === "first"
    ? { firstPremise: proposition, secondPremise: premises.secondPremise }
    : { firstPremise: premises.firstPremise, secondPremise: proposition };
}

function complementBiliteralCell(
  cell: BiliteralCell,
  role: "S" | "M" | "P",
): BiliteralCell {
  if (role === "M") return cell;
  const mappings: Readonly<Record<"S" | "P", Readonly<Record<BiliteralCell, BiliteralCell>>>> = {
    S: { SP: "sP", Sp: "sp", sP: "SP", sp: "Sp" },
    P: { SP: "Sp", Sp: "SP", sP: "sp", sp: "sP" },
  };
  return mappings[role][cell];
}

function complementBiliteralState(
  state: BiliteralDiagramState | null,
  role: "S" | "M" | "P",
): BiliteralDiagramState | null {
  if (state === null) return null;
  const cellOrder: readonly BiliteralCell[] = ["SP", "Sp", "sP", "sp"];
  const orderCells = (cells: readonly BiliteralCell[]) =>
    [...cells].sort((left, right) =>
      cellOrder.indexOf(left) - cellOrder.indexOf(right)
    );
  return {
    emptyCells: orderCells(state.emptyCells.map((cell) =>
      complementBiliteralCell(cell, role)
    )),
    existentials: state.existentials.map((existential) => ({
      sourceId: existential.sourceId,
      possibleCells: orderCells(existential.possibleCells.map((cell) =>
        complementBiliteralCell(cell, role)
      )),
    })),
  };
}

function runSinglePremiseTransforms(
  name: string,
  settings: LogicSettings,
  transform: PropositionTransform,
  exactPresentation: boolean,
): number {
  let count = 0;
  for (const premises of ABSTRACT_PREMISE_PAIRS) {
    for (const position of ["first", "second"] as const) {
      const original = position === "first"
        ? premises.firstPremise
        : premises.secondPremise;
      const transformedProposition = transform(original);
      if (transformedProposition === null) continue;
      const transformedPremises = replacePremise(premises, position, transformedProposition);
      assertSemanticInvariant(
        `${name}:${position}`,
        settings,
        premises,
        transformedPremises,
        exactPresentation,
      );
      count += 1;
    }
  }
  return count;
}

describe("proposition metamorphism oracle validation", () => {
  const propositions = [...MP_VARIANTS, ...SM_VARIANTS, ...SIGNED_RETINEND_CANDIDATES];

  it("keeps E/I conversion and O/I-complement truth sets equal in both modes", () => {
    for (const settings of SETTINGS) {
      for (const proposition of propositions) {
        for (const transform of [
          swapEOrIArguments,
          rewriteOAsIComplement,
          rewriteIComplementAsO,
        ]) {
          const transformed = transform(proposition);
          if (transformed === null) continue;
          expect(propositionTruthMask(transformed, settings), propositionId(proposition))
            .toBe(propositionTruthMask(proposition, settings));
        }
      }
    }
  });

  it("keeps A/E-complement and A contraposition truth sets equal only in modern mode", () => {
    const modern: LogicSettings = { existentialImport: "modern" };
    for (const proposition of propositions) {
      for (const transform of [
        rewriteModernAAsEComplement,
        rewriteModernEComplementAsA,
        contraposeModernA,
      ]) {
        const transformed = transform(proposition);
        if (transformed === null) continue;
        expect(propositionTruthMask(transformed, modern), propositionId(proposition))
          .toBe(propositionTruthMask(proposition, modern));
      }
    }
  });

  it("treats complement toggling as an involution", () => {
    for (const role of ["S", "M", "P"] as const) {
      for (const complemented of [false, true]) {
        const occurrence = abstractTerm(role, complemented);
        expect(toggleOccurrenceComplement(toggleOccurrenceComplement(occurrence)))
          .toEqual(occurrence);
      }
    }
  });

  it("maps global S/M/P complementation bijectively in both modes", () => {
    for (const settings of SETTINGS) {
      for (const role of ["S", "M", "P"] as const) {
        for (const proposition of propositions) {
          const transformed = complementRoleInProposition(proposition, role);
          for (const model of ALL_SEMANTIC_MODELS) {
            const transformedModel = oracleComplementRoleModel(model, role);
            const context = `${settings.existentialImport}:${role}:${propositionId(proposition)}`;
            if (
              oraclePropositionIsTrue(transformedModel, transformed, settings) !==
              oraclePropositionIsTrue(model, proposition, settings)
            ) throw new Error(`Global complement truth mismatch: ${context}`);
            if (
              JSON.stringify(oracleComplementRoleModel(transformedModel, role)) !==
              JSON.stringify(model)
            ) throw new Error(`Global complement is not involutive: ${context}`);
          }
        }
      }
    }
  });

  it("records Carroll existential-import counterexamples for both modern-only A relations", () => {
    const carroll: LogicSettings = { existentialImport: "carroll" };
    const modern: LogicSettings = { existentialImport: "modern" };
    const allSP: AbstractProposition = {
      form: "A",
      subject: abstractTerm("S"),
      predicate: abstractTerm("P"),
    };
    const noSNotP = rewriteModernAAsEComplement(allSP);
    const contraposed = contraposeModernA(allSP);
    if (noSNotP === null || contraposed === null) throw new Error("Missing A transform.");
    const emptySubjectModel = ALL_SEMANTIC_MODELS.find((model) =>
      !oraclePropositionIsTrue(model, allSP, carroll) &&
      oraclePropositionIsTrue(model, noSNotP, carroll)
    );
    expect(emptySubjectModel, "A/E′ Carroll countermodel").toBeDefined();
    const contrapositionCountermodel = ALL_SEMANTIC_MODELS.find((model) =>
      oraclePropositionIsTrue(model, allSP, carroll) !==
      oraclePropositionIsTrue(model, contraposed, carroll)
    );
    expect(
      contrapositionCountermodel === undefined
        ? undefined
        : formatSemanticModel(contrapositionCountermodel),
      "A contraposition Carroll countermodel",
    ).toBeDefined();
    expect(propositionTruthMask(allSP, modern)).toBe(propositionTruthMask(noSNotP, modern));
    expect(propositionTruthMask(allSP, modern)).toBe(propositionTruthMask(contraposed, modern));
  });
});

describe("ConclusionPresentation exhaustive metamorphic relations", () => {
  it("keeps Celarent, Ferio, and No.25 presentations under E/I conversion", () => {
    const settings: LogicSettings = { existentialImport: "carroll" };
    const cases: readonly {
      readonly name: string;
      readonly premises: AbstractSyllogism;
      readonly expectedPresentation: readonly string[];
    }[] = [
      {
        name: "Celarent",
        premises: {
          firstPremise: { form: "E", subject: abstractTerm("M"), predicate: abstractTerm("P") },
          secondPremise: { form: "A", subject: abstractTerm("S"), predicate: abstractTerm("M") },
        },
        expectedPresentation: ["E:S>P"],
      },
      {
        name: "Ferio",
        premises: {
          firstPremise: { form: "E", subject: abstractTerm("M"), predicate: abstractTerm("P") },
          secondPremise: { form: "I", subject: abstractTerm("S"), predicate: abstractTerm("M") },
        },
        expectedPresentation: ["O:S>P"],
      },
      {
        name: "No.25",
        premises: {
          firstPremise: { form: "A", subject: abstractTerm("M"), predicate: abstractTerm("P") },
          secondPremise: { form: "E", subject: abstractTerm("S"), predicate: abstractTerm("M", true) },
        },
        expectedPresentation: ["E:S>P′"],
      },
    ];
    for (const testCase of cases) {
      const transformedFirst = swapEOrIArguments(testCase.premises.firstPremise);
      const transformedSecond = swapEOrIArguments(testCase.premises.secondPremise);
      const transformed: AbstractSyllogism = {
        firstPremise: transformedFirst ?? testCase.premises.firstPremise,
        secondPremise: transformedSecond ?? testCase.premises.secondPremise,
      };
      assertSemanticInvariant(
        `${testCase.name}:readable-sentinel`,
        settings,
        testCase.premises,
        transformed,
        true,
      );
      expect(
        presentationIds(observe(transformed, settings).presentation),
        testCase.name,
      ).toEqual(testCase.expectedPresentation);
    }
  });

  it.each(SETTINGS)("preserves E/I semantic and presentation structure in $existentialImport mode", (settings) => {
    const singleCount = runSinglePremiseTransforms(
      "swap-E-I",
      settings,
      swapEOrIArguments,
      true,
    );
    let bothCount = 0;
    for (const premises of ABSTRACT_PREMISE_PAIRS) {
      const first = swapEOrIArguments(premises.firstPremise);
      const second = swapEOrIArguments(premises.secondPremise);
      if (first === null || second === null) continue;
      assertSemanticInvariant(
        "swap-E-I:both",
        settings,
        premises,
        { firstPremise: first, secondPremise: second },
        true,
      );
      bothCount += 1;
    }
    expect(singleCount).toBe(1024);
    expect(bothCount).toBe(256);
  });

  it.each(SETTINGS)("preserves O/I-complement semantics in $existentialImport mode", (settings) => {
    const oToI = runSinglePremiseTransforms(
      "O-to-I-complement",
      settings,
      rewriteOAsIComplement,
      false,
    );
    const iToO = runSinglePremiseTransforms(
      "I-complement-to-O",
      settings,
      rewriteIComplementAsO,
      false,
    );
    expect(oToI).toBe(512);
    expect(iToO).toBe(512);
  });

  it("preserves modern A/E-complement semantics", () => {
    const settings: LogicSettings = { existentialImport: "modern" };
    expect(runSinglePremiseTransforms(
      "modern-A-to-E-complement",
      settings,
      rewriteModernAAsEComplement,
      false,
    )).toBe(512);
    expect(runSinglePremiseTransforms(
      "modern-E-complement-to-A",
      settings,
      rewriteModernEComplementAsA,
      false,
    )).toBe(512);
  });

  it("preserves modern A contraposition semantics", () => {
    const settings: LogicSettings = { existentialImport: "modern" };
    expect(runSinglePremiseTransforms(
      "modern-A-contraposition",
      settings,
      contraposeModernA,
      false,
    )).toBe(512);
  });

  it.each(SETTINGS)("preserves oracle semantics under global role complementation in $existentialImport mode", (settings) => {
    for (const role of ["S", "M", "P"] as const) {
      for (const premises of ABSTRACT_PREMISE_PAIRS) {
        const transformed = complementRoleEverywhere(premises, role);
        const originalResult = observe(premises, settings);
        const transformedResult = observe(transformed, settings);
        const context = `${settings.existentialImport}:${role}:${premisePairId(premises)}`;
        expect(transformedResult.ok, context).toBe(originalResult.ok);
        expect(transformedResult.complete, context).toBe(originalResult.complete);
        expect(transformedResult.biliteralState, context).toEqual(
          complementBiliteralState(originalResult.biliteralState, role),
        );
        const transformedModels = ALL_SEMANTIC_MODELS.filter((model) =>
          oraclePropositionIsTrue(model, premises.firstPremise, settings) &&
          oraclePropositionIsTrue(model, premises.secondPremise, settings)
        ).map((model) => oracleComplementRoleModel(model, role));
        expect(
          transformedModels.every((model) =>
            oraclePropositionIsTrue(model, transformed.firstPremise, settings) &&
            oraclePropositionIsTrue(model, transformed.secondPremise, settings)
          ),
          context,
        ).toBe(true);
      }
    }
  });
});
