import { isLocale, type Locale } from "../domain/locale";
import { parseSafeSvgElement } from "../app/svgDom";
import type {
  TutorialSectionViewModel,
  TutorialViewModel,
} from "./model";

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

function renderSection(section: TutorialSectionViewModel): HTMLElement {
  const node = el("section", "tutorial__section");
  node.id = section.id;
  const heading = el("h2");
  heading.textContent = section.heading;
  node.append(heading);
  section.paragraphs.forEach((text) => {
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
  section.tables?.forEach((table) => {
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
        if (cell instanceof HTMLTableCellElement && index === 0) {
          cell.scope = "row";
        }
        cell.textContent = text;
        tr.append(cell);
      });
      body.append(tr);
    });
    tableNode.append(caption, head, body);
    wrapper.append(tableNode);
    node.append(wrapper);
  });
  section.diagrams.forEach((diagram) => {
    const figure = el("figure", "tutorial__diagram");
    const diagramHeading = el("h3");
    diagramHeading.textContent = diagram.heading;
    const svg = parseSafeSvgElement(diagram.svg);
    const caption = el("figcaption");
    caption.textContent = diagram.description;
    figure.append(diagramHeading, svg, caption);
    node.append(figure);
  });
  const sources = el("div", "tutorial__rule-sources");
  const sourceList = el("dl");
  section.ruleSources.forEach((rule) => {
    const term = el("dt");
    term.id = `rule-${rule.id}`;
    term.textContent = rule.label;
    const definition = el("dd");
    rule.citations.forEach((citation, index) => {
      const citationNode = citation.href === null ? el("span") : el("a");
      citationNode.className =
        `tutorial__citation tutorial__citation--${citation.relation}`;
      citationNode.textContent = citation.label;
      if (citationNode instanceof HTMLAnchorElement) {
        citationNode.href = citation.href ?? "";
      }
      if (index > 0) definition.append(document.createTextNode(" "));
      definition.append(citationNode);
    });
    sourceList.append(term, definition);
  });
  sources.append(sourceList);
  node.append(sources);
  return node;
}

function renderSourceReferences(model: TutorialViewModel): HTMLElement {
  const aside = el("aside", "tutorial__source-references");
  aside.id = "source-references";
  aside.setAttribute("aria-labelledby", "source-references-heading");
  const heading = el("h2");
  heading.id = "source-references-heading";
  heading.textContent = model.sourceReferencesHeading;
  const description = el("p");
  description.textContent = model.sourceReferencesDescription;
  const list = el("ol");
  model.sourceEntries.forEach((entry) => {
    const item = el("li");
    item.id = entry.id;
    const title = el("h3");
    title.textContent = `${entry.workTitle} — ${entry.locationLabel}`;
    const edition = el("p");
    edition.textContent = entry.edition;
    const locator = el("p");
    locator.textContent = entry.pageLabel === null
      ? entry.locator
      : `${entry.locator} · ${entry.pageLabel}`;
    item.append(title, edition, locator);
    if (entry.note !== null) {
      const note = el("p");
      note.textContent = entry.note;
      item.append(note);
    }
    list.append(item);
  });
  aside.append(heading, description, list);
  return aside;
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
  const notice = el("p", "tutorial__notice");
  notice.textContent = model.notice;
  main.append(
    notice,
    ...model.sections.map(renderSection),
    renderSourceReferences(model),
  );
  root.replaceChildren(skip, header, navigation, main);
}
