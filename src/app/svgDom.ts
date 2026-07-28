const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function parseSafeSvgElement(svgMarkup: string): SVGSVGElement {
  const parsed = new DOMParser().parseFromString(svgMarkup, "image/svg+xml");
  if (parsed.querySelector("parsererror") !== null) {
    throw new Error("Failed to parse generated SVG.");
  }
  const root = parsed.documentElement;
  if (
    root.localName !== "svg" ||
    root.namespaceURI !== SVG_NAMESPACE ||
    root.querySelector("script, foreignObject") !== null ||
    [...root.querySelectorAll("*")].some((node) =>
      [...node.attributes].some((attribute) =>
        attribute.name.startsWith("on") ||
        (
          (attribute.name === "href" || attribute.name === "xlink:href") &&
          !attribute.value.startsWith("#")
        )
      )
    )
  ) {
    throw new Error("Generated SVG contains unsupported content.");
  }
  const imported = document.importNode(root, true);
  if (!(imported instanceof SVGSVGElement)) {
    throw new Error("Imported SVG root is invalid.");
  }
  return imported;
}
