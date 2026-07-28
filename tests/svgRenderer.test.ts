import { describe, expect, it } from "vitest";
import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../src/domain/counterPlacement";
import {
  renderBiliteralDiagramSvg,
  renderTriliteralDiagramSvg,
} from "../src/diagram/svgRenderer";

const emptyTriliteral: TriliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};
const emptyBiliteral: BiliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};

describe("SVG board structure", () => {
  it("renders the triliteral board and inner square", () => {
    const svg = renderTriliteralDiagramSvg(emptyTriliteral);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 400 400"');
    expect(svg).toContain('class="carroll-diagram carroll-diagram--triliteral"');
    expect(svg).toContain('data-diagram-kind="triliteral"');
    expect(svg).toContain(
      '<rect class="carroll-diagram__outer" x="40" y="40" width="320" height="320"',
    );
    expect(svg).toContain(
      '<rect class="carroll-diagram__inner" x="120" y="120" width="160" height="160"',
    );
    expect(svg.match(/class="carroll-diagram__divider"/g)).toHaveLength(2);
  });

  it("renders a biliteral board without inner square or M labels", () => {
    const svg = renderBiliteralDiagramSvg(emptyBiliteral);

    expect(svg).toContain('data-diagram-kind="biliteral"');
    expect(svg).toContain('class="carroll-diagram__outer"');
    expect(svg.match(/class="carroll-diagram__divider"/g)).toHaveLength(2);
    expect(svg).not.toContain('class="carroll-diagram__inner"');
    expect(svg).not.toContain('data-label-role="M"');
    expect(svg).not.toContain('data-label-role="m"');
  });

  it("renders all diagram labels at fixed coordinates", () => {
    const triliteral = renderTriliteralDiagramSvg(emptyTriliteral);
    const biliteral = renderBiliteralDiagramSvg(emptyBiliteral);

    for (const fragment of [
      'data-label-role="S" x="200" y="24"',
      'data-label-role="s" x="200" y="390"',
      'data-label-role="P" x="16" y="205"',
      'data-label-role="p" x="384" y="205"',
      'data-label-role="M" x="200" y="112"',
      'data-label-role="m" x="200" y="62"',
      ">S′</text>",
      ">P′</text>",
      ">M′</text>",
    ]) {
      expect(triliteral).toContain(fragment);
    }

    expect(biliteral).toContain(">S′</text>");
    expect(biliteral).toContain(">P′</text>");
    expect(biliteral).not.toContain(">M</text>");
    expect(biliteral).not.toContain(">M′</text>");
  });
});

describe("SVG counters", () => {
  it("renders emptiness before existence with symbols and sourceIds", () => {
    const svg = renderTriliteralDiagramSvg({
      emptinessCounters: [
        {
          kind: "emptiness",
          anchor: { type: "cell", cell: "SmP" },
        },
      ],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["major", "minor"],
          anchor: { type: "cell", cell: "SMP" },
        },
      ],
    });

    expect(svg).toContain(
      'class="carroll-counter carroll-counter--emptiness" data-counter-kind="emptiness"',
    );
    expect(svg).toContain('<circle cx="80" cy="80" r="14"');
    expect(svg).toContain('x="80" y="80" text-anchor="middle"');
    expect(svg).toContain(">O</text>");
    expect(svg).toContain(
      'class="carroll-counter carroll-counter--existence" data-counter-kind="existence"',
    );
    expect(svg).toContain('<circle cx="160" cy="160" r="14"');
    expect(svg).toContain(
      'data-source-ids="[&quot;major&quot;,&quot;minor&quot;]"',
    );
    expect(svg).toContain(">I</text>");
    expect(svg.indexOf("carroll-counter--emptiness")).toBeLessThan(
      svg.indexOf("carroll-counter--existence"),
    );
  });

  it.each([
    [
      "triliteral S",
      () =>
        renderTriliteralDiagramSvg({
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: [],
              anchor: {
                type: "boundary",
                cells: ["SMP", "sMP"],
                partitionRole: "S",
              },
            },
          ],
        }),
      'cx="160" cy="200"',
    ],
    [
      "triliteral M",
      () =>
        renderTriliteralDiagramSvg({
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: [],
              anchor: {
                type: "boundary",
                cells: ["SMP", "SmP"],
                partitionRole: "M",
              },
            },
          ],
        }),
      'cx="120" cy="120"',
    ],
    [
      "triliteral P",
      () =>
        renderTriliteralDiagramSvg({
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: [],
              anchor: {
                type: "boundary",
                cells: ["SMP", "SMp"],
                partitionRole: "P",
              },
            },
          ],
        }),
      'cx="200" cy="160"',
    ],
    [
      "biliteral S",
      () =>
        renderBiliteralDiagramSvg({
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: [],
              anchor: {
                type: "boundary",
                cells: ["SP", "sP"],
                partitionRole: "S",
              },
            },
          ],
        }),
      'cx="120" cy="200"',
    ],
    [
      "biliteral P",
      () =>
        renderBiliteralDiagramSvg({
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: [],
              anchor: {
                type: "boundary",
                cells: ["SP", "Sp"],
                partitionRole: "P",
              },
            },
          ],
        }),
      'cx="200" cy="120"',
    ],
  ] as const)("renders %s boundary counter", (_name, render, expected) => {
    expect(render()).toContain(expected);
  });

  it("renders an empty board without counter elements", () => {
    const svg = renderBiliteralDiagramSvg(emptyBiliteral);

    expect(svg).toContain('class="carroll-diagram__board"');
    expect(svg).not.toContain('data-counter-kind=');
  });
});

describe("SVG accessibility and safety", () => {
  it("uses an accessible label when supplied and hides otherwise", () => {
    const labelled = renderBiliteralDiagramSvg(emptyBiliteral, {
      accessibleLabel: "Conclusion diagram",
    });
    const hidden = renderBiliteralDiagramSvg(emptyBiliteral);

    expect(labelled).toContain('role="img"');
    expect(labelled).toContain('aria-label="Conclusion diagram"');
    expect(labelled).not.toContain('aria-hidden="true"');
    expect(hidden).toContain('aria-hidden="true"');
    expect(hidden).not.toContain('role="img"');
  });

  it("renders descriptions only when supplied", () => {
    expect(
      renderTriliteralDiagramSvg(emptyTriliteral, {
        description: "Premises",
      }),
    ).toContain("<desc>Premises</desc>");
    expect(renderTriliteralDiagramSvg(emptyTriliteral)).not.toContain(
      "<desc>",
    );
  });

  it("escapes labels, descriptions, and JSON sourceIds", () => {
    const svg = renderBiliteralDiagramSvg(
      {
        emptinessCounters: [],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ['a&<>"\''],
            anchor: { type: "cell", cell: "SP" },
          },
        ],
      },
      {
        accessibleLabel: '<script>"&\'</script>',
        description: '<script onload="bad">\'&</script>',
      },
    );

    expect(svg).toContain(
      'aria-label="&lt;script&gt;&quot;&amp;&apos;&lt;/script&gt;"',
    );
    expect(svg).toContain(
      "<desc>&lt;script onload=&quot;bad&quot;&gt;&apos;&amp;&lt;/script&gt;</desc>",
    );
    expect(svg).toContain(
      'data-source-ids="[&quot;a&amp;&lt;&gt;\\&quot;&apos;&quot;]"',
    );
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("<script onload=");
  });

  it("contains no prohibited elements, handlers, URLs, or invalid numbers", () => {
    const svg = renderTriliteralDiagramSvg(emptyTriliteral);

    for (const prohibited of [
      "<script",
      "<foreignObject",
      "onclick=",
      "onload=",
      "javascript:",
      "http://",
      "https://",
      'type="module"',
      "NaN",
      "undefined",
      "Infinity",
    ]) {
      if (prohibited === "http://") {
        expect(svg.replace("http://www.w3.org/2000/svg", "")).not.toContain(
          prohibited,
        );
      } else {
        expect(svg).not.toContain(prohibited);
      }
    }
  });

  it("is non-destructive and deterministic for frozen placements", () => {
    const placements: BiliteralCounterPlacements = Object.freeze({
      emptinessCounters: Object.freeze([
        Object.freeze({
          kind: "emptiness" as const,
          anchor: Object.freeze({
            type: "cell" as const,
            cell: "Sp" as const,
          }),
        }),
      ]),
      existenceCounters: Object.freeze([
        Object.freeze({
          kind: "existence" as const,
          sourceIds: Object.freeze(["frozen"]),
          anchor: Object.freeze({
            type: "cell" as const,
            cell: "SP" as const,
          }),
        }),
      ]),
    });
    const options = Object.freeze({
      accessibleLabel: "Frozen",
      description: "Stable",
    });

    const first = renderBiliteralDiagramSvg(placements, options);
    const second = renderBiliteralDiagramSvg(placements, options);

    expect(first).toBe(second);
    expect(placements.existenceCounters[0]?.sourceIds).toEqual(["frozen"]);
  });
});
