import { describe, expect, it } from "vitest";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import {
  renderBiliteralDiagramSvg,
  renderTriliteralDiagramSvg,
} from "../src/diagram/svgRenderer";
import { createConclusionCounterPlacements } from "../src/logic/conclusionDisplay";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { createTriliteralCounterPlacements } from "../src/logic/counterPlacements";

const carroll: LogicSettings = { existentialImport: "carroll" };
const modern: LogicSettings = { existentialImport: "modern" };

const syllogisms = {
  barbara: {
    firstPremise: { form: "A", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  celarent: {
    firstPremise: { form: "E", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  darii: {
    firstPremise: { form: "A", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "I", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  ferio: {
    firstPremise: { form: "E", subject: { role: "M", complemented: false }, predicate: { role: "P", complemented: false } },
    secondPremise: { form: "I", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
  invalid: {
    firstPremise: { form: "A", subject: { role: "P", complemented: false }, predicate: { role: "M", complemented: false } },
    secondPremise: { form: "A", subject: { role: "S", complemented: false }, predicate: { role: "M", complemented: false } },
  },
} as const satisfies Record<string, AbstractSyllogism>;

function renderSyllogism(
  syllogism: AbstractSyllogism,
  settings: LogicSettings,
) {
  const inference = inferSyllogismConclusion(syllogism, settings);
  if (!inference.ok) throw new Error(inference.reason);

  const triliteral = createTriliteralCounterPlacements(
    inference.triliteralState,
  );
  if (!triliteral.ok) throw new Error(triliteral.reason);

  const conclusion = createConclusionCounterPlacements(
    inference.biliteralState,
    inference.entailedForms,
  );
  if (!conclusion.ok) throw new Error(conclusion.reason);

  return {
    triliteralSvg: renderTriliteralDiagramSvg(triliteral.placements),
    conclusionSvg: renderBiliteralDiagramSvg(conclusion.placements),
  };
}

function counterCount(svg: string): number {
  return svg.match(/data-counter-kind=/g)?.length ?? 0;
}

describe("SVG diagram integration", () => {
  it("renders Barbara in Carroll and modern modes", () => {
    const carrollSvgs = renderSyllogism(syllogisms.barbara, carroll);
    const modernSvgs = renderSyllogism(syllogisms.barbara, modern);

    expect(carrollSvgs.triliteralSvg).toContain(
      'data-diagram-kind="triliteral"',
    );
    expect(carrollSvgs.triliteralSvg).toContain('data-label-role="M" x="180" y="140"');
    expect(carrollSvgs.triliteralSvg).toContain('data-label-role="m" x="180" y="100"');
    expect(carrollSvgs.conclusionSvg).toContain(
      'data-counter-kind="emptiness"><circle cx="280" cy="120"',
    );
    expect(carrollSvgs.conclusionSvg).toContain(
      'data-source-ids="[&quot;second-premise&quot;]"><circle cx="120" cy="120"',
    );
    expect(counterCount(carrollSvgs.conclusionSvg)).toBe(2);

    expect(modernSvgs.conclusionSvg).toContain(
      'data-counter-kind="emptiness"><circle cx="280" cy="120"',
    );
    expect(modernSvgs.conclusionSvg).not.toContain(
      'data-counter-kind="existence"',
    );
    expect(counterCount(modernSvgs.conclusionSvg)).toBe(1);
  });

  it("renders Celarent in Carroll and modern modes", () => {
    const carrollSvg = renderSyllogism(
      syllogisms.celarent,
      carroll,
    ).conclusionSvg;
    const modernSvg = renderSyllogism(
      syllogisms.celarent,
      modern,
    ).conclusionSvg;

    expect(carrollSvg).toContain(
      'data-counter-kind="emptiness"><circle cx="120" cy="120"',
    );
    expect(carrollSvg).toContain(
      'data-source-ids="[&quot;second-premise&quot;]"><circle cx="280" cy="120"',
    );
    expect(counterCount(carrollSvg)).toBe(2);
    expect(modernSvg).toContain(
      'data-counter-kind="emptiness"><circle cx="120" cy="120"',
    );
    expect(modernSvg).not.toContain('data-counter-kind="existence"');
  });

  it.each([
    ["Darii", syllogisms.darii, 120],
    ["Ferio", syllogisms.ferio, 280],
  ] as const)(
    "renders only the expected existence for %s",
    (_name, syllogism, x) => {
      const svg = renderSyllogism(syllogism, carroll).conclusionSvg;

      expect(svg).toContain(
        `data-source-ids="[&quot;second-premise&quot;]"><circle cx="${x}" cy="120"`,
      );
      expect(svg).not.toContain('data-counter-kind="emptiness"');
      expect(counterCount(svg)).toBe(1);
    },
  );

  it("renders an empty biliteral board for an invalid syllogism", () => {
    const svg = renderSyllogism(
      syllogisms.invalid,
      carroll,
    ).conclusionSvg;

    expect(svg).toContain('data-diagram-kind="biliteral"');
    expect(counterCount(svg)).toBe(0);
  });

  it("keeps all generated SVGs safe and numerically valid", () => {
    const generated = [
      renderSyllogism(syllogisms.barbara, carroll),
      renderSyllogism(syllogisms.barbara, modern),
      renderSyllogism(syllogisms.celarent, carroll),
      renderSyllogism(syllogisms.celarent, modern),
      renderSyllogism(syllogisms.darii, carroll),
      renderSyllogism(syllogisms.ferio, carroll),
      renderSyllogism(syllogisms.invalid, carroll),
    ].flatMap(({ triliteralSvg, conclusionSvg }) => [
      triliteralSvg,
      conclusionSvg,
    ]);

    for (const svg of generated) {
      expect(svg).not.toContain("NaN");
      expect(svg).not.toContain("undefined");
      expect(svg).not.toContain("<script");
      expect(svg).not.toContain("<image");
      expect(svg).not.toContain("<use");
      expect(svg.replace("http://www.w3.org/2000/svg", "")).not.toContain(
        "http://",
      );
    }
  });
});
