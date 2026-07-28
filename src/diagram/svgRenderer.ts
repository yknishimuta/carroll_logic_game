import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import {
  createBiliteralDiagramLayout,
  createTriliteralDiagramLayout,
  resolveBiliteralCounterPosition,
  resolveTriliteralCounterPosition,
  type LineGeometry,
  type Point,
  type RectGeometry,
  type ViewBoxGeometry,
} from "./layout";

export interface DiagramSvgOptions {
  readonly accessibleLabel?: string;
  readonly description?: string;
}

const BOARD_ATTRIBUTES =
  'fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"';
const TEXT_ATTRIBUTES =
  'text-anchor="middle" dominant-baseline="middle" fill="currentColor"';

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function viewBoxValue(viewBox: ViewBoxGeometry): string {
  return `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`;
}

function renderRect(rect: RectGeometry, className: string): string {
  return `<rect class="${className}" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" ${BOARD_ATTRIBUTES}/>`;
}

function renderLine(line: LineGeometry, index: number): string {
  return `<line class="carroll-diagram__divider" data-divider-index="${index}" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" ${BOARD_ATTRIBUTES}/>`;
}

function renderLabel(role: string, label: string, point: Point): string {
  return `<text class="carroll-diagram__label" data-label-role="${role}" x="${point.x}" y="${point.y}" ${TEXT_ATTRIBUTES}>${escapeXml(label)}</text>`;
}

function renderCounter(
  kind: "emptiness" | "existence",
  point: Point,
  radius: number,
  sourceIds?: readonly string[],
): string {
  const sourceAttribute =
    sourceIds === undefined
      ? ""
      : ` data-source-ids="${escapeXml(JSON.stringify(sourceIds))}"`;
  const symbol = kind === "emptiness" ? "O" : "I";

  return `<g class="carroll-counter carroll-counter--${kind}" data-counter-kind="${kind}"${sourceAttribute}><circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/><text x="${point.x}" y="${point.y}" ${TEXT_ATTRIBUTES}>${symbol}</text></g>`;
}

function renderSvgStart(
  kind: "triliteral" | "biliteral",
  viewBox: ViewBoxGeometry,
  options: DiagramSvgOptions,
): string {
  const accessibility =
    options.accessibleLabel === undefined
      ? 'aria-hidden="true"'
      : `role="img" aria-label="${escapeXml(options.accessibleLabel)}"`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxValue(viewBox)}" class="carroll-diagram carroll-diagram--${kind}" data-diagram-kind="${kind}" ${accessibility}>`;
}

function renderDescription(options: DiagramSvgOptions): string {
  return options.description === undefined
    ? ""
    : `<desc>${escapeXml(options.description)}</desc>`;
}

export function renderTriliteralDiagramSvg(
  placements: TriliteralCounterPlacements,
  options: DiagramSvgOptions = {},
): string {
  const layout = createTriliteralDiagramLayout();
  const emptinessCounters = placements.emptinessCounters.map((placement) =>
    renderCounter(
      placement.kind,
      resolveTriliteralCounterPosition(placement.anchor),
      layout.counterRadius,
    ),
  );
  const existenceCounters = placements.existenceCounters.map((placement) =>
    renderCounter(
      placement.kind,
      resolveTriliteralCounterPosition(placement.anchor),
      layout.counterRadius,
      placement.sourceIds,
    ),
  );

  return [
    renderSvgStart("triliteral", layout.viewBox, options),
    renderDescription(options),
    '<g class="carroll-diagram__board">',
    renderRect(layout.outerRect, "carroll-diagram__outer"),
    ...layout.dividerLines.map(renderLine),
    renderRect(layout.innerRect, "carroll-diagram__inner"),
    "</g>",
    '<g class="carroll-diagram__labels">',
    renderLabel("S", "S", { x: 200, y: 24 }),
    renderLabel("s", "S′", { x: 200, y: 390 }),
    renderLabel("P", "P", { x: 16, y: 205 }),
    renderLabel("p", "P′", { x: 384, y: 205 }),
    renderLabel("M", "M", { x: 200, y: 112 }),
    renderLabel("m", "M′", { x: 200, y: 62 }),
    "</g>",
    '<g class="carroll-diagram__emptiness-counters">',
    ...emptinessCounters,
    "</g>",
    '<g class="carroll-diagram__existence-counters">',
    ...existenceCounters,
    "</g>",
    "</svg>",
  ].join("");
}

export function renderBiliteralDiagramSvg(
  placements: BiliteralCounterPlacements,
  options: DiagramSvgOptions = {},
): string {
  const layout = createBiliteralDiagramLayout();
  const emptinessCounters = placements.emptinessCounters.map((placement) =>
    renderCounter(
      placement.kind,
      resolveBiliteralCounterPosition(placement.anchor),
      layout.counterRadius,
    ),
  );
  const existenceCounters = placements.existenceCounters.map((placement) =>
    renderCounter(
      placement.kind,
      resolveBiliteralCounterPosition(placement.anchor),
      layout.counterRadius,
      placement.sourceIds,
    ),
  );

  return [
    renderSvgStart("biliteral", layout.viewBox, options),
    renderDescription(options),
    '<g class="carroll-diagram__board">',
    renderRect(layout.outerRect, "carroll-diagram__outer"),
    ...layout.dividerLines.map(renderLine),
    "</g>",
    '<g class="carroll-diagram__labels">',
    renderLabel("S", "S", { x: 200, y: 24 }),
    renderLabel("s", "S′", { x: 200, y: 390 }),
    renderLabel("P", "P", { x: 16, y: 205 }),
    renderLabel("p", "P′", { x: 384, y: 205 }),
    "</g>",
    '<g class="carroll-diagram__emptiness-counters">',
    ...emptinessCounters,
    "</g>",
    '<g class="carroll-diagram__existence-counters">',
    ...existenceCounters,
    "</g>",
    "</svg>",
  ].join("");
}
