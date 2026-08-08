import { isLocale, type Locale } from "../domain/locale";
import { parseSafeSvgElement } from "../app/svgDom";
import type {
  TutorialSectionViewModel,
  TutorialDiagramViewModel,
  TutorialViewBlock,
  TutorialViewModel,
} from "./model";
import type { TutorialTable } from "./content";

export interface TutorialEventHandlers {
  readonly onLocaleChange: (locale: Locale) => void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== undefined) node.className = className;
  return node;
}

function renderTable(table: TutorialTable): HTMLElement {
  const wrapper = el("div", "tutorial__table-scroll");
  wrapper.tabIndex = 0;
  const tableNode = el("table");
  const caption = el("caption");
  caption.textContent = table.caption;
  const head = el("thead");
  const headRow = el("tr");
  table.headers.forEach((text) => {
    const cell = el("th");
    cell.scope = "col";
    cell.textContent = text;
    headRow.append(cell);
  });
  head.append(headRow);
  const body = el("tbody");
  table.rows.forEach((row) => {
    const tr = el("tr");
    row.forEach((text, index) => {
      const cell = index === 0 ? el("th") : el("td");
      if (cell instanceof HTMLTableCellElement && index === 0) cell.scope = "row";
      cell.textContent = text;
      tr.append(cell);
    });
    body.append(tr);
  });
  tableNode.append(caption, head, body);
  wrapper.append(tableNode);
  return wrapper;
}

function renderDiagram(diagram: TutorialDiagramViewModel): HTMLElement {
  const figure = el("figure", "tutorial__diagram");
  const diagramHeading = el("h3");
  diagramHeading.textContent = diagram.heading;
  const svg = parseSafeSvgElement(diagram.svg);
  const caption = el("figcaption");
  caption.textContent = diagram.description;
  figure.append(diagramHeading, svg, caption);
  return figure;
}

function renderBlock(block: TutorialViewBlock): HTMLElement {
  if (block.kind === "subheading") {
    const subheading = el("h3");
    subheading.textContent = block.text;
    return subheading;
  }
  if (block.kind === "paragraph") {
    const paragraph = el("p");
    paragraph.textContent = block.text;
    return paragraph;
  }
  if (block.kind === "diagram") return renderDiagram(block.diagram);
  if (block.kind === "table") return renderTable(block.table);
  const list = el(block.ordered === true ? "ol" : "ul");
  block.items.forEach((text) => {
    const item = el("li");
    item.textContent = text;
    list.append(item);
  });
  return list;
}

function renderSection(
  section: TutorialSectionViewModel,
  sectionIndex: number,
  relatedPassagesLabel: string,
): HTMLElement {
  const node = el("section", "tutorial__section");
  node.id = section.id;
  const heading = el("h2");
  heading.textContent = `${sectionIndex + 1}. ${section.heading}`;
  node.append(heading);
  if (section.blocks !== undefined) {
    node.append(...section.blocks.map(renderBlock));
  } else section.paragraphs.forEach((text) => {
    const paragraph = el("p");
    paragraph.textContent = text;
    node.append(paragraph);
  });
  section.lists?.forEach((items) => {
    const list = el(section.id === "manual-operation" ? "ol" : "ul");
    items.forEach((text) => {
      const item = el("li");
      item.textContent = text;
      list.append(item);
    });
    node.append(list);
  });
  section.tables?.forEach((table) => node.append(renderTable(table)));
  section.diagrams.forEach((diagram) => node.append(renderDiagram(diagram)));
  if (section.locators.length > 0) {
    const locators = el("aside", "tutorial__source-note tutorial__locators");
    const label = el("span", "tutorial__source-note-label");
    label.textContent = relatedPassagesLabel;
    locators.append(label, document.createTextNode(" "));
    section.locators.forEach((locator, index) => {
      if (index > 0) locators.append(document.createTextNode(" "));
      const item = el("span", "tutorial__locator");
      item.textContent = locator;
      locators.append(item);
    });
    node.append(locators);
  }
  return node;
}

export function renderTutorial(
  root: HTMLElement,
  model: TutorialViewModel,
  handlers: TutorialEventHandlers,
): void {
  const skip = el("a", "skip-link");
  skip.href = "#tutorial-main";
  skip.textContent = model.skipLinkLabel;
  const header = el("header", "tutorial__header");
  const title = el("h1");
  title.textContent = model.title;
  const back = el("a");
  back.href = "./index.html";
  back.textContent = model.backToGameLabel;
  const localeLabel = el("label");
  const localeText = el("span");
  localeText.textContent = model.languageLabel;
  const localeSelect = el("select");
  localeSelect.dataset.action = "tutorial-locale";
  localeSelect.dataset.focusKey = "tutorial-locale";
  ([
    { value: "ja", text: "日本語" },
    { value: "en", text: "English" },
  ] as const).forEach(({ value, text }) => {
    const option = el("option");
    option.value = value;
    option.textContent = text;
    localeSelect.append(option);
  });
  localeSelect.value = model.locale;
  localeSelect.addEventListener("change", () => {
    if (!isLocale(localeSelect.value)) {
      throw new Error(`Unknown tutorial locale: "${localeSelect.value}".`);
    }
    handlers.onLocaleChange(localeSelect.value);
  });
  localeLabel.append(localeText, localeSelect);
  header.append(title, back, localeLabel);

  const navigation = el("nav", "tutorial__contents");
  navigation.setAttribute("aria-label", model.tableOfContentsLabel);
  const contentsHeading = el("h2");
  contentsHeading.textContent = model.tableOfContentsLabel;
  const contents = el("ol");
  model.sections.forEach((section) => {
    const item = el("li");
    const link = el("a");
    link.href = `#${section.id}`;
    link.textContent = section.heading;
    item.append(link);
    contents.append(item);
  });
  navigation.append(contentsHeading, contents);
  const main = el("main");
  main.id = "tutorial-main";
  main.tabIndex = -1;
  const notice = el("div", "tutorial__notice");
  const introduction = el("p", "tutorial__notice-introduction");
  const introductionText = el("strong");
  introductionText.textContent = model.notice;
  introduction.append(introductionText);
  const bibliography = el("p", "tutorial__bibliography");
  const bibliographyLabel = el("strong");
  bibliographyLabel.textContent = model.bibliographyLabel;
  bibliography.append(bibliographyLabel, document.createElement("br"));
  bibliography.append(document.createTextNode(model.bibliography.author));
  const bibliographyTitle = el("em");
  bibliographyTitle.textContent = model.bibliography.title;
  bibliography.append(
    bibliographyTitle,
    document.createTextNode(model.bibliography.publication),
  );
  const locatorExplanation = el("p", "tutorial__locator-explanation");
  locatorExplanation.textContent = model.locatorExplanation;
  notice.append(introduction, bibliography, locatorExplanation);
  main.append(
    notice,
    ...model.sections.map((section, index) =>
      renderSection(section, index, model.relatedPassagesLabel)
    ),
  );
  root.replaceChildren(skip, header, navigation, main);
}
