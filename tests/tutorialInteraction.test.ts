// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mountTutorial } from "../src/tutorial";

describe("mountTutorial", () => {
  it("switches both languages, preserves diagrams, and restores locale focus", () => {
    const root = document.createElement("div");
    root.id = "tutorial-app";
    document.body.replaceChildren(root);
    mountTutorial(root);
    expect(document.documentElement.lang).toBe("ja");
    expect(root.querySelectorAll("main section")).toHaveLength(11);
    const firstSection = root.querySelector("#syllogism-basics");
    expect(firstSection?.querySelector("h2")?.textContent).toBe("1. 三段論法と項");
    expect(firstSection?.querySelectorAll("table")).toHaveLength(0);
    expect(firstSection?.querySelectorAll(".tutorial__table-scroll")).toHaveLength(0);
    expect(firstSection?.textContent).not.toContain("三段論法の例と抽象形");
    const jaParagraphs = [...firstSection?.querySelectorAll("p") ?? []];
    expect(jaParagraphs.slice(0, 4).map(({ textContent }) => textContent)).toEqual([
      "三段論法は、二つの前提を組み合わせて一つの結論を導く推論です。例えば、次のような前提と結論を考えます。",
      "前提1　すべての動物は死すべきものである。", "前提2　すべての人間は動物である。", "結論　すべての人間は死すべきものである。",
    ]);
    expect(jaParagraphs.slice(9, 12).map(({ textContent }) => textContent)).toEqual([
      "前提1　すべてのMはPである（All M are P）", "前提2　すべてのSはMである（All S are M）", "結論　すべてのSはPである（All S are P）",
    ]);
    expect(jaParagraphs.indexOf(jaParagraphs[3]!)).toBeLessThan(jaParagraphs.indexOf(jaParagraphs[4]!));
    expect(jaParagraphs.indexOf(jaParagraphs[8]!)).toBeLessThan(jaParagraphs.indexOf(jaParagraphs[9]!));
    expect(jaParagraphs.indexOf(jaParagraphs[11]!)).toBeLessThan(jaParagraphs.indexOf(jaParagraphs[12]!));
    expect(firstSection?.querySelector(".tutorial__locators")).toBeNull();
    expect(firstSection?.textContent).not.toContain("本アプリの操作仕様");
    expect(firstSection?.textContent).toContain("結論の主語となる「人間」を小項");
    expect(firstSection?.textContent).toContain("推論形式を「妥当である」");
    const secondLink = root.querySelectorAll<HTMLAnchorElement>("nav li a")[1];
    expect(secondLink?.getAttribute("href")).toBe("#syllogism-figures-and-moods");
    expect(secondLink?.textContent).toBe("三段論法の格と命題形式");
    const secondSection = root.querySelector("#syllogism-figures-and-moods");
    expect(secondSection).not.toBeNull();
    expect(secondSection?.querySelector("h2")?.textContent).toBe("2. 三段論法の格と命題形式");
    expect(secondSection?.querySelectorAll("table")).toHaveLength(3);
    expect(secondSection?.querySelectorAll("tbody")[0]?.querySelectorAll("tr")).toHaveLength(4);
    expect(secondSection?.querySelectorAll("tbody")[2]?.querySelectorAll("tr")).toHaveLength(5);
    expect([...secondSection?.querySelectorAll("caption") ?? []].map(({ textContent }) => textContent))
      .toEqual(["三段論法の四つの格", "A・E・I・Oの命題形式", "妥当な三段論法の代表的形式"]);
    const secondSectionChildren = [...secondSection?.children ?? []];
    const orderedTables = secondSection?.querySelectorAll(".tutorial__table-scroll");
    expect(secondSectionChildren.indexOf(orderedTables?.[0] ?? document.body))
      .toBeLessThan(secondSectionChildren.indexOf(orderedTables?.[1] ?? document.documentElement));
    expect(root.querySelector("#terms-and-primes")).toBeNull();
    const eightSection = root.querySelector("#eight-regions");
    const biliteralSection = root.querySelector("#biliteral-diagram");
    const countersSection = root.querySelector("#counters");
    expect(eightSection).not.toBeNull();
    expect(eightSection?.querySelector("h2")?.textContent).toBe("3. 三文字図と領域");
    expect(eightSection?.querySelectorAll("table")).toHaveLength(0);
    expect(eightSection?.querySelector("ul")?.children).toHaveLength(3);
    expect(eightSection?.querySelector("h3")?.textContent).toBe("空の三文字図");
    expect(root.querySelector('nav a[href="#terms-and-primes"]')).toBeNull();
    expect(root.querySelector('nav a[href="#eight-regions"]')?.textContent).toBe("三文字図と領域");
    expect(eightSection?.textContent).not.toContain("三文字図のセル略記");
    expect(biliteralSection).not.toBeNull();
    expect(eightSection?.nextElementSibling).toBe(biliteralSection);
    expect(biliteralSection?.nextElementSibling).toBe(countersSection);
    expect(root.querySelector('nav a[href="#biliteral-diagram"]')?.textContent).toBe("二文字図と結論の読み取り");
    expect(biliteralSection?.querySelector("h3")?.textContent).toBe("空の二文字図");
    expect(biliteralSection?.querySelector("svg")?.getAttribute("aria-label")).toBe("空の二文字図");
    expect(biliteralSection?.textContent).toContain("この操作を「Mの消去」と呼びます");
    expect(biliteralSection?.textContent).toContain("M／M′の区別を無視");
    expect(biliteralSection?.querySelectorAll("table")).toHaveLength(1);
    expect(biliteralSection?.querySelector("caption")?.textContent).toBe("中項Mを消去する対応");
    expect(biliteralSection?.querySelectorAll("tbody tr")).toHaveLength(4);
    const orderedList = [...biliteralSection?.querySelectorAll("ol") ?? []]
      .find(({ children }) => children.length === 4) ?? document.body;
    expect(orderedList.children).toHaveLength(4);
    const biliteralChildren = [...biliteralSection?.children ?? []];
    const figure = biliteralSection?.querySelector("figure") ?? document.body;
    const correspondenceTable = biliteralSection?.querySelector(".tutorial__table-scroll") ?? document.body;
    const emptyRule = [...biliteralSection?.querySelectorAll("p") ?? []].find(({ textContent }) => textContent?.includes("両方とも空")) ?? document.body;
    const locators = biliteralSection?.querySelector(".tutorial__locators") ?? document.body;
    expect(biliteralChildren.indexOf(figure)).toBeLessThan(biliteralChildren.indexOf(correspondenceTable));
    expect(biliteralChildren.indexOf(correspondenceTable)).toBeLessThan(biliteralChildren.indexOf(emptyRule));
    expect(biliteralChildren.indexOf(emptyRule)).toBeLessThan(biliteralChildren.indexOf(orderedList));
    expect(biliteralChildren.indexOf(orderedList)).toBeLessThan(biliteralChildren.indexOf(locators));
    expect(biliteralSection?.lastElementChild).toBe(locators);
    expect(locators.textContent).toBe(
      "原著の関連箇所： (I.V.I) (I.IV.IV) (I.V.II.2) (I.V.II.3)",
    );
    expect(locators.querySelector("a")).toBeNull();
    expect(countersSection?.querySelector("h2")?.textContent).toBe("5. O駒とI駒");
    const counterParagraphs = [...countersSection?.querySelectorAll("p:not(.tutorial__locators)") ?? []];
    expect(counterParagraphs.map(({ textContent }) => textContent)).toEqual([
      "O駒は、その領域が空であり、そこに属する対象が一つも存在しないことを示します。",
      "I駒は、その領域に少なくとも一つの対象が存在することを示します。正確なセルが決まっている場合はセル内に置き、隣接する二つのセルのどちらにあるかまでしか分からない場合は、その境界上に置きます。",
      "境界上のI駒は、両方のセルに対象が存在することを意味するのではありません。どちらか一方のセルに対象が存在するものの、どちらであるかがまだ確定していないことを示します。",
      "別々の前提から生じる存在要求は、同じ対象についてのものとは限りません。",
      "同じ位置に複数の存在要求が生じた場合、画面上では一つのI駒にまとめて表示されることがありますが、それらが同一の対象を表すという意味ではありません。",
    ]);
    expect(countersSection?.textContent).not.toContain("I命題");
    expect(countersSection?.lastElementChild?.classList.contains("tutorial__locators")).toBe(true);
    expect(countersSection?.nextElementSibling?.id).toBe("proposition-rules");
    expect(root.querySelector('nav a[href="#counters"]')?.textContent).toBe("O駒とI駒");
    const propositionSection = root.querySelector("#proposition-rules");
    expect(propositionSection?.querySelector("h2")?.textContent).toBe("6. A・E・I・Oの配置規則");
    const propositionParagraphs = [...propositionSection?.querySelectorAll("p:not(.tutorial__locators)") ?? []];
    expect(propositionSection?.querySelector("h3")?.textContent)
      .toBe("All（すべて）で始まる命題について");
    expect([...propositionSection?.querySelectorAll("h3") ?? []].map(({ textContent }) => textContent))
      .toEqual(["All（すべて）で始まる命題について", "命題形式ごとの駒の置き方"]);
    expect(propositionSection?.textContent).toContain("二重命題（Double Proposition）");
    expect([...propositionSection?.querySelectorAll("ul li") ?? []].map(
      ({ textContent }) => textContent,
    )).toEqual(["Some M are P", "No M are P′"]);
    for (const heading of [
      "全称肯定（All M are P）：", "全称否定（No M are P）：",
      "特称肯定（Some M are P）：", "特称否定（Some M are not P）：",
    ]) expect(propositionParagraphs.some(({ textContent }) => textContent === heading)).toBe(true);
    expect(propositionSection?.textContent).toContain("存在を示すI駒と、空であることを示すO駒の両方");
    expect(propositionSection?.textContent).toContain("No M are P′から");
    expect(propositionSection?.textContent).toContain("Some M are Pから");
    const propositionChildren = [...propositionSection?.children ?? []];
    const propositionTableWrapper = propositionSection?.querySelector(".tutorial__table-scroll") ?? document.body;
    expect(propositionChildren.indexOf(propositionParagraphs.at(-1) ?? document.body))
      .toBeLessThan(propositionChildren.indexOf(propositionTableWrapper));
    expect(propositionSection?.querySelector("caption")?.textContent).toBe("命題形式と領域の対応");
    expect(propositionSection?.textContent).not.toContain("キャロル方式の四命題");
    expect(propositionSection?.querySelectorAll("tbody tr")).toHaveLength(4);
    expect([...propositionSection?.querySelectorAll("tbody th") ?? []].map(({ textContent }) => textContent))
      .toEqual(["A", "E", "I", "O"]);
    expect(propositionSection?.lastElementChild?.classList.contains("tutorial__locators")).toBe(true);
    expect(propositionSection?.lastElementChild?.textContent).toContain("(I.II.III.3)");
    expect(propositionSection?.nextElementSibling?.id).toBe("boundary-existence");
    const boundarySection = root.querySelector("#boundary-existence");
    expect(boundarySection?.querySelector("h2")?.textContent).toBe("7. 境界上のI駒");
    const boundaryParagraphs = [...boundarySection?.querySelectorAll("p") ?? []];
    expect(boundaryParagraphs[0]?.textContent).toContain("境界上のI駒がセル内に確定する条件");
    expect(boundaryParagraphs[5]?.textContent).toContain("SMPとsMPの境界上");
    expect(boundaryParagraphs[5]?.textContent).toContain("SMPにO駒");
    expect(boundaryParagraphs[6]?.textContent).toContain("sMPのセル内へ確定");
    expect(boundarySection?.textContent).toContain("両方のセルがまだ空でない可能性");
    expect(boundarySection?.textContent).toContain("別の境界へ移したり");
    expect(boundarySection?.textContent).not.toContain("A／B");
    expect([...boundarySection?.querySelectorAll("h3") ?? []].map(({ textContent }) => textContent))
      .toEqual(["初期状態", "追加情報", "確定後"]);
    expect([...boundarySection?.querySelectorAll("figcaption") ?? []].map(({ textContent }) => textContent))
      .toEqual([
        "I駒はSMPとsMPの境界上にあります。",
        "SMPにO駒が置かれ、SMPが空であることが分かります。",
        "存在する対象はsMPにあると確定し、I駒はsMPのセル内にあります。",
      ]);
    const boundaryChildren = [...boundarySection?.children ?? []];
    expect(boundaryChildren.indexOf(boundaryParagraphs[6] ?? document.body))
      .toBeLessThan(boundaryChildren.indexOf(boundarySection?.querySelector("figure") ?? document.documentElement));
    expect(boundarySection?.nextElementSibling?.id).toBe("barbara");
    expect(root.querySelector("#combine-premises")).toBeNull();
    expect(root.querySelector('nav a[href="#combine-premises"]')).toBeNull();
    expect(root.textContent).not.toContain("二つの前提を統合する");
    expect(root.querySelector("#eliminate-middle")).toBeNull();
    expect(root.querySelector('nav a[href="#eliminate-middle"]')).toBeNull();
    expect(root.textContent).not.toContain("Mを消去して結論図を作る");
    const barbaraSection = root.querySelector("#barbara");
    expect(barbaraSection?.querySelector("h2")?.textContent).toBe("8. ゲームによるBarbaraの説明");
    expect(root.querySelector('nav a[href="#barbara"]')?.textContent).toBe("ゲームによるBarbaraの説明");
    expect(barbaraSection?.textContent).not.toContain("Barbaraの完全例");
    const barbaraParagraphs = [...barbaraSection?.querySelectorAll("p") ?? []];
    expect(barbaraParagraphs.slice(0, 4).map(({ textContent }) => textContent)).toEqual([
      "第一前提：すべての動物は死すべきものである。",
      "第二前提：すべての人間は動物である。",
      "結論：すべての人間は死すべきものである。",
      "項への割当ては、S＝人間、M＝動物、P＝死すべきものです。",
    ]);
    for (const text of [
      "All M are P", "O駒がSMpとsMp", "SMPとsMPの境界（S／S′境界）",
      "All S are M", "SMPとSMpの境界（P／P′境界）", "SMPのセル内へ確定",
      "O駒はSMp・sMp・SmP・Smp", "SMPとsMPの境界上", "SMPのセル内",
      "SpにO駒", "SPにI駒", "すべての人間は死すべきものである",
    ]) expect(barbaraSection?.textContent).toContain(text);
    expect(barbaraSection?.querySelectorAll("figure")).toHaveLength(3);
    const barbaraTable = barbaraSection?.querySelector("table");
    const barbaraTableWrapper = barbaraTable?.parentElement;
    expect(barbaraTable?.querySelector("caption")?.textContent)
      .toBe("結論の命題形式と二文字図");
    expect(barbaraTable?.querySelectorAll("thead th")).toHaveLength(3);
    expect(barbaraTable?.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(barbaraTable?.textContent).toContain("全称肯定（A）All S are P");
    expect(barbaraTable?.textContent).toContain("全称否定（E）No S are P");
    expect(barbaraTable?.textContent).toContain("特称肯定（I）Some S are P");
    expect(barbaraTable?.textContent).toContain("特称否定（O）Some S are not P");
    const barbaraChildren = [...barbaraSection?.children ?? []];
    const projection = barbaraParagraphs.find((paragraph) =>
      paragraph.textContent?.includes("二文字図ではSpにO駒、SPにI駒")
    );
    const comparison = barbaraParagraphs.find((paragraph) =>
      paragraph.textContent?.startsWith("この表に照らすと")
    );
    const finalConclusion = barbaraParagraphs.find((paragraph) =>
      paragraph.textContent?.includes("S＝人間、P＝死すべきもの")
    );
    expect(barbaraChildren.indexOf(projection ?? document.body))
      .toBeLessThan(barbaraChildren.indexOf(barbaraTableWrapper ?? document.documentElement));
    expect(barbaraChildren.indexOf(barbaraTableWrapper ?? document.documentElement))
      .toBeLessThan(barbaraChildren.indexOf(comparison ?? document.body));
    expect(barbaraChildren.indexOf(comparison ?? document.body))
      .toBeLessThan(barbaraChildren.indexOf(finalConclusion ?? document.body));
    expect(barbaraParagraphs.filter((paragraph) =>
      paragraph.textContent?.includes("という結論が得られます")
    )).toHaveLength(1);
    const commonMistakes = root.querySelector("#common-mistakes");
    expect(commonMistakes?.querySelector("h2")?.textContent).toBe("10. よくある間違い");
    expect(commonMistakes?.querySelector("p")?.textContent).toBe("次の間違いにご注意ください。");
    expect(commonMistakes?.querySelectorAll("ul")).toHaveLength(1);
    const jaMistakes = [...commonMistakes?.querySelectorAll("li") ?? []].map(({ textContent }) => textContent);
    expect(jaMistakes).toHaveLength(8);
    expect(jaMistakes.map((item) => item?.split(" → ")[0])).toEqual([
      "S′を反対語と思う",
      "境界にあるI駒を両方の領域にある存在と思う",
      "境界にあるI駒を根拠なく移す",
      "空条件に対してO駒を一つだけ置く",
      "二つのI駒を同一対象と思う",
      "三文字図の片方のO駒だけで、二文字図で結論をO駒にする",
      "O駒を命題全体の偽と思う",
      "I駒を数字1と読む",
    ]);
    expect(jaMistakes.every((item) => item?.includes("→"))).toBe(true);
    expect(commonMistakes?.nextElementSibling?.id).toBe("quick-reference");
    const jaCounterCount = root.querySelectorAll(".carroll-diagram__counter").length;
    let select = root.querySelector<HTMLSelectElement>('[data-action="tutorial-locale"]')!;
    select.focus();
    select.value = "en";
    select.dispatchEvent(new Event("change"));
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toContain("Counter Placement Tutorial");
    expect(root.querySelector("h1")?.textContent).toBe("Counter Placement Tutorial");
    const englishFirstSection = root.querySelector("#syllogism-basics");
    expect(englishFirstSection?.querySelector("h2")?.textContent)
      .toBe("1. Syllogisms and Terms");
    expect(englishFirstSection?.textContent).toContain("minor term");
    expect(englishFirstSection?.textContent).toContain("factually true");
    expect(englishFirstSection?.querySelectorAll("table")).toHaveLength(0);
    const enParagraphs = [...englishFirstSection?.querySelectorAll("p") ?? []];
    expect(enParagraphs.slice(1, 4).map(({ textContent }) => textContent)).toEqual([
      "Premise 1: All animals are mortal.", "Premise 2: All humans are animals.", "Conclusion: All humans are mortal.",
    ]);
    expect(enParagraphs.slice(9, 12).map(({ textContent }) => textContent)).toEqual([
      "Premise 1: All M are P.", "Premise 2: All S are M.", "Conclusion: All S are P.",
    ]);
    expect(englishFirstSection?.querySelector(".tutorial__locators")).toBeNull();
    expect(englishFirstSection?.textContent).not.toContain("Application behavior");
    expect(root.querySelectorAll("main section")).toHaveLength(11);
    expect(root.querySelector("#eight-regions h2")?.textContent).toBe("3. Triliteral Diagrams and Regions");
    expect(root.querySelector("#eight-regions table")).toBeNull();
    const englishBiliteral = root.querySelector("#biliteral-diagram");
    expect(englishBiliteral?.querySelector("h2")?.textContent).toBe("4. The Biliteral Diagram and Reading the Conclusion");
    expect(englishBiliteral?.querySelector("h3")?.textContent).toBe("Empty biliteral diagram");
    expect(englishBiliteral?.querySelectorAll("svg")).toHaveLength(1);
    expect(englishBiliteral?.textContent).toContain("This operation is called eliminating M");
    expect(englishBiliteral?.querySelectorAll("table")).toHaveLength(1);
    expect(englishBiliteral?.querySelector("caption")?.textContent).toBe("Eliminating the Middle Term M");
    expect(englishBiliteral?.querySelectorAll("tbody tr")).toHaveLength(4);
    const englishFlow = [...englishBiliteral?.querySelectorAll("ol") ?? []]
      .find(({ children }) => children.length === 4) ?? document.body;
    expect(englishFlow.children).toHaveLength(4);
    const englishBiliteralChildren = [...englishBiliteral?.children ?? []];
    const englishFigure = englishBiliteral?.querySelector("figure") ?? document.body;
    const englishTable = englishBiliteral?.querySelector(".tutorial__table-scroll") ?? document.body;
    const englishEmptyRule = [...englishBiliteral?.querySelectorAll("p") ?? []]
      .find(({ textContent }) => textContent?.includes("both corresponding cells")) ?? document.body;
    expect(englishBiliteralChildren.indexOf(englishFigure)).toBeLessThan(englishBiliteralChildren.indexOf(englishTable));
    expect(englishBiliteralChildren.indexOf(englishTable)).toBeLessThan(englishBiliteralChildren.indexOf(englishEmptyRule));
    expect(englishBiliteralChildren.indexOf(englishEmptyRule)).toBeLessThan(englishBiliteralChildren.indexOf(englishFlow));
    expect(englishBiliteral?.lastElementChild?.classList.contains("tutorial__locators")).toBe(true);
    const englishCounters = root.querySelector("#counters");
    expect(englishCounters?.querySelector("h2")?.textContent).toBe("5. O and I counters");
    expect([...englishCounters?.querySelectorAll("p:not(.tutorial__locators)") ?? []].map(({ textContent }) => textContent)).toEqual([
      "An O-counter indicates that a region is empty and that no object belongs to that region.",
      "An I-counter indicates that at least one object exists in a region. When the exact cell is determined, the counter is placed inside that cell. When it is only known that the object belongs to one of two adjacent cells, the counter is placed on the boundary between them.",
      "An I-counter on a boundary does not mean that objects exist in both cells. It means that an object exists in one of the two cells, but it has not yet been determined which one.",
      "Existence requirements arising from different premises do not necessarily concern the same object.",
      "When several existence requirements occur at the same position, the application may display them as a single I-counter, but this does not mean that they represent one and the same object.",
    ]);
    expect(englishCounters?.textContent).not.toContain("I-proposition");
    expect(englishCounters?.lastElementChild?.classList.contains("tutorial__locators")).toBe(true);
    expect(englishCounters?.nextElementSibling?.id).toBe("proposition-rules");
    const englishPropositions = root.querySelector("#proposition-rules");
    expect(englishPropositions?.querySelector("h3")?.textContent)
      .toBe("About Propositions Beginning with All");
    expect(englishPropositions?.textContent).toContain("Double Proposition");
    expect([...englishPropositions?.querySelectorAll("ul li") ?? []].map(
      ({ textContent }) => textContent,
    )).toEqual(["Some M are P", "No M are P′"]);
    const englishPropositionParagraphs = [
      ...englishPropositions?.querySelectorAll("p:not(.tutorial__locators)") ?? [],
    ];
    expect([...englishPropositions?.querySelectorAll("h3") ?? []].map(({ textContent }) => textContent))
      .toEqual(["About Propositions Beginning with All", "Counter Placement for Each Proposition Form"]);
    for (const heading of [
      "Universal affirmative (All M are P):", "Universal negative (No M are P):",
      "Particular affirmative (Some M are P):", "Particular negative (Some M are not P):",
    ]) expect(englishPropositionParagraphs.some(
      ({ textContent }) => textContent === heading,
    )).toBe(true);
    expect(englishPropositions?.textContent).toContain("I-counter to indicate existence");
    expect(englishPropositions?.textContent).toContain("O-counters to indicate emptiness");
    expect(englishPropositions?.querySelector("caption")?.textContent)
      .toBe("Correspondence Between Proposition Forms and Regions");
    expect(englishPropositions?.textContent).not.toContain("Four proposition forms");
    expect(englishPropositions?.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(englishPropositions?.lastElementChild?.classList.contains("tutorial__locators")).toBe(true);
    expect(englishPropositions?.nextElementSibling?.id).toBe("boundary-existence");
    const englishBoundary = root.querySelector("#boundary-existence");
    const englishBoundaryParagraphs = [...englishBoundary?.querySelectorAll("p") ?? []];
    expect(englishBoundaryParagraphs[0]?.textContent).toContain("boundary can be resolved");
    expect(englishBoundaryParagraphs[5]?.textContent).toContain("boundary between SMP and sMP");
    expect(englishBoundaryParagraphs[5]?.textContent).toContain("O-counter is later placed in SMP");
    expect(englishBoundaryParagraphs[6]?.textContent).toContain("resolved into the sMP cell");
    expect(englishBoundary?.textContent).not.toContain("A/B");
    expect([...englishBoundary?.querySelectorAll("h3") ?? []].map(({ textContent }) => textContent))
      .toEqual(["Initial state", "Additional information", "Resolved state"]);
    expect(englishBoundary?.querySelectorAll("figure")).toHaveLength(3);
    expect(englishBoundary?.nextElementSibling?.id).toBe("barbara");
    expect(root.querySelector("#combine-premises")).toBeNull();
    expect(root.querySelector('nav a[href="#combine-premises"]')).toBeNull();
    expect(root.textContent).not.toContain("Combining two premises");
    expect(root.querySelector("#eliminate-middle")).toBeNull();
    expect(root.querySelector('nav a[href="#eliminate-middle"]')).toBeNull();
    const englishBarbara = root.querySelector("#barbara");
    expect(englishBarbara?.querySelector("h2")?.textContent).toBe("8. Barbara Explained Through the Game");
    expect(root.querySelector('nav a[href="#barbara"]')?.textContent).toBe("Barbara Explained Through the Game");
    expect(englishBarbara?.textContent).not.toContain("Complete Barbara example");
    const englishBarbaraParagraphs = [...englishBarbara?.querySelectorAll("p") ?? []];
    expect(englishBarbaraParagraphs.slice(0, 4).map(({ textContent }) => textContent)).toEqual([
      "First premise: All animals are mortal.",
      "Second premise: All humans are animals.",
      "Conclusion: All humans are mortal.",
      "The terms are assigned as S = humans, M = animals, and P = mortal things.",
    ]);
    for (const text of [
      "All M are P", "SMp and sMp", "boundary between SMP and sMP", "All S are M",
      "boundary between SMP and SMp", "resolved into the SMP cell", "SMp, sMp, SmP, and Smp",
      "I-counter inside the SMP cell", "O-counter in Sp", "I-counter in SP", "All humans are mortal",
    ]) expect(englishBarbara?.textContent).toContain(text);
    expect(englishBarbara?.querySelectorAll("figure")).toHaveLength(3);
    const englishBarbaraTable = englishBarbara?.querySelector("table");
    expect(englishBarbaraTable?.querySelector("caption")?.textContent)
      .toBe("Conclusion Forms and the Biliteral Diagram");
    expect(englishBarbaraTable?.querySelectorAll("thead th")).toHaveLength(3);
    expect(englishBarbaraTable?.querySelectorAll("tbody tr")).toHaveLength(4);
    expect(englishBarbara?.textContent).toContain("According to this table");
    expect(englishBarbara?.textContent).toContain("universal affirmative All S are P");
    expect(englishBarbara?.textContent).toContain("S stands for humans and P for mortal things");
    const englishMistakes = root.querySelector("#common-mistakes");
    expect(englishMistakes?.querySelector("h2")?.textContent).toBe("10. Common mistakes");
    expect(englishMistakes?.querySelector("p")?.textContent)
      .toBe("Watch out for the following common mistakes.");
    expect(englishMistakes?.querySelectorAll("ul")).toHaveLength(1);
    const enMistakes = [...englishMistakes?.querySelectorAll("li") ?? []].map(({ textContent }) => textContent);
    expect(enMistakes).toHaveLength(8);
    expect(enMistakes.map((item) => item?.split(" → ")[0])).toEqual([
      "Treating S′ as the opposite of S",
      "Treating an I-counter on a boundary as existence in both regions",
      "Moving an I-counter off a boundary without justification",
      "Placing only one O-counter for an emptiness condition",
      "Treating two I-counters as referring to the same object",
      "Using only one O-counter in the triliteral diagram to place an O-counter in the biliteral conclusion",
      "Treating an O-counter as meaning that the whole proposition is false",
      "Reading an I-counter as the digit 1",
    ]);
    expect(enMistakes.every((item) => item?.includes("→"))).toBe(true);
    expect(englishMistakes?.nextElementSibling?.id).toBe("quick-reference");
    expect(root.querySelector("#syllogism-figures-and-moods h2")?.textContent)
      .toBe("2. Figures and Proposition Forms of Syllogisms");
    expect(root.querySelector("#source-references-heading")).toBeNull();
    expect(root.querySelector(".tutorial__source-references")).toBeNull();
    expect(root.textContent).not.toContain("(Application behavior)");
    expect(root.textContent).not.toContain("（本アプリの操作仕様）");
    const englishIntro = root.querySelector(".tutorial__notice");
    expect(englishIntro?.querySelector(".tutorial__bibliography")?.textContent).toBe(
      "Reference:Lewis Carroll, Symbolic Logic, Part I: Elementary, 4th ed., Macmillan, 1897.",
    );
    expect(englishIntro?.querySelector(".tutorial__bibliography em")?.textContent)
      .toBe("Symbolic Logic, Part I: Elementary");
    expect(englishIntro?.querySelector(".tutorial__locator-explanation")?.textContent)
      .toBe("The “Related passages in the original” shown at the end of each section indicate passages corresponding to that explanation.");
    expect(englishBiliteral?.querySelector(".tutorial__source-note-label")?.textContent)
      .toBe("Related passages in the original:");
    expect(root.querySelectorAll('[href^="#source-symbolic-logic-"]')).toHaveLength(0);
    expect(root.querySelectorAll('[id^="source-symbolic-logic-"]')).toHaveLength(0);
    expect(root.querySelectorAll(".carroll-diagram__counter")).toHaveLength(jaCounterCount);
    expect(document.activeElement).toBe(
      root.querySelector('[data-action="tutorial-locale"]'),
    );
    select = root.querySelector<HTMLSelectElement>('[data-action="tutorial-locale"]')!;
    select.value = "ja";
    select.dispatchEvent(new Event("change"));
    expect(root.textContent).not.toContain("Back to the game");
    for (const link of root.querySelectorAll<HTMLAnchorElement>("nav a")) {
      expect(root.querySelector(link.hash)).not.toBeNull();
    }
  });
});
