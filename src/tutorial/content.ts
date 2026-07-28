import type { Locale } from "../domain/locale";
import type { TutorialSourceReference } from "./sourceReferences";

export interface TutorialRuleSource {
  readonly id: string;
  readonly label: string;
  readonly sourceReferences: readonly TutorialSourceReference[];
}

export interface TutorialTable {
  readonly caption: string;
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface TutorialSectionContent {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly lists?: readonly (readonly string[])[];
  readonly tables?: readonly TutorialTable[];
  readonly ruleSources: readonly TutorialRuleSource[];
}

export interface TutorialContent {
  readonly title: string;
  readonly documentTitle: string;
  readonly skipLink: string;
  readonly backToGame: string;
  readonly languageLabel: string;
  readonly contentsLabel: string;
  readonly notice: string;
  readonly sections: readonly TutorialSectionContent[];
}

const ids = [
  "syllogism-basics",
  "terms-and-primes",
  "eight-regions",
  "counters",
  "proposition-rules",
  "boundary-existence",
  "combine-premises",
  "eliminate-middle",
  "barbara",
  "manual-operation",
  "common-mistakes",
  "quick-reference",
] as const;

const cellRowsJa = [
  ["SMP", "S ∩ M ∩ P", "Sであり、Mであり、Pである"],
  ["SMp", "S ∩ M ∩ P′", "Sであり、Mであり、Pではない"],
  ["SmP", "S ∩ M′ ∩ P", "Sであり、Mではなく、Pである"],
  ["Smp", "S ∩ M′ ∩ P′", "Sであり、MでもPでもない"],
  ["sMP", "S′ ∩ M ∩ P", "Sではなく、Mであり、Pである"],
  ["sMp", "S′ ∩ M ∩ P′", "Sではなく、Mであり、Pではない"],
  ["smP", "S′ ∩ M′ ∩ P", "SでもMでもなく、Pである"],
  ["smp", "S′ ∩ M′ ∩ P′", "S、M、Pのいずれでもない"],
] as const;

const cellRowsEn = [
  ["SMP", "S ∩ M ∩ P", "S, M, and P"],
  ["SMp", "S ∩ M ∩ P′", "S and M, but not P"],
  ["SmP", "S ∩ M′ ∩ P", "S and P, but not M"],
  ["Smp", "S ∩ M′ ∩ P′", "S, but neither M nor P"],
  ["sMP", "S′ ∩ M ∩ P", "not S, but M and P"],
  ["sMp", "S′ ∩ M ∩ P′", "not S, M, and not P"],
  ["smP", "S′ ∩ M′ ∩ P", "neither S nor M, but P"],
  ["smp", "S′ ∩ M′ ∩ P′", "none of S, M, or P"],
] as const;

export const JA_TUTORIAL_CONTENT: TutorialContent = {
  title: "コマ配置のチュートリアル",
  documentTitle: "コマ配置のチュートリアル — ルイス・キャロルの論理ゲーム",
  skipLink: "本文へ移動",
  backToGame: "ゲームへ戻る",
  languageLabel: "言語",
  contentsLabel: "チュートリアルの目次",
  notice: "このチュートリアルは、現在のゲームで採用しているルイス・キャロル方式を説明しています。",
  sections: [
    {
      id: ids[0], heading: "1. 三段論法とS・M・P",
      paragraphs: [
        "三段論法は、二つの前提を組み合わせて一つの結論を導く推論です。ゲームで扱うBarbara型を例にすると、次のように並びます。",
        "三段論法には三つの項が現れます。Sは結論の主語となる小項（この例では「人間」）、Pは結論の述語となる大項（「死すべきもの」）、Mは二つの前提をつなぐ中項（「動物」）です。",
        "抽象形を見ると、Mは前提1と前提2の両方に現れますが、結論には現れないことが分かります。このゲームでは二つの前提を図にまとめた後、Mの区別を取り除き、残ったSとPの関係を結論として読み取ります。",
      ],
      tables: [{
        caption: "三段論法の具体例と抽象形",
        headers: ["段階", "具体的な文", "抽象形"],
        rows: [
          ["前提1", "すべての動物は死すべきものである", "すべてのMはPである（All M are P）"],
          ["前提2", "すべての人間は動物である", "すべてのSはMである（All S are M）"],
          ["結論", "すべての人間は死すべきものである", "すべてのSはPである（All S are P）"],
        ],
      }],
      ruleSources: [],
    },
    {
      id: ids[1], heading: "2. S・M・Pとプライム記号",
      paragraphs: [
        "S′は「Sの反対語」ではありません。現在の対象領域（考えている対象全体）のうち、Sではないものすべて、つまりSの補集合です。",
        "Sが人間ならS′は人間ではないものです。動物だけでなく、植物、石、建物など、対象領域にある人間でないものがすべて入り得ます。",
        "SとS′は同時には成立せず、すべての対象は必ずどちらかに属します。M／M′、P／P′も同じように領域を二分します。",
        "セル名では小文字s・m・pをS′・M′・P′の内部略記として使います。小文字は別の項ではありません。",
      ],
      ruleSources: [
        { id: "complement-terms", label: "S′・M′・P′は各項の補集合", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-i" }] },
        { id: "lowercase-cell-shorthand", label: "小文字s・m・pによるセル略記", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[2], heading: "3. 三文字図の8領域",
      paragraphs: ["S／S′、M／M′、P／P′という三つの二分から、2 × 2 × 2 = 8領域ができます。"],
      tables: [{ caption: "三文字図のセル略記", headers: ["略記", "完全表記", "意味"], rows: cellRowsJa }],
      ruleSources: [
        { id: "eight-triliteral-regions", label: "三文字図の8領域", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-i" }] },
      ],
    },
    {
      id: ids[3], heading: "4. O駒とI駒",
      paragraphs: [
        "O駒は、そのセルが空で、そこに属する対象が一つも存在しないことを示します。Oはセル内に置き、命題全体の「偽」を示す記号ではありません。",
        "I駒は、その領域に少なくとも一つ対象が存在することを示します。正確なセルが決まればセル内、隣接二セルのどちらかまでしか分からなければ境界上です。",
        "境界上のIは両セルに存在する意味ではなく、どちらか一方に存在するが未確定という意味です。別々の前提のIは同じ対象とは限りません。同じ位置の複数の存在要求は画面上で一つにまとまる場合があります。",
      ],
      ruleSources: [
        { id: "empty-counter", label: "O駒はセルが空であることを表す", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
        { id: "existence-counter", label: "I駒は少なくとも一つの存在を表す", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
        { id: "boundary-existence-meaning", label: "境界Iは二セルのどちらかに存在する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }] },
      ],
    },
    {
      id: ids[4], heading: "5. A・E・I・Oの配置規則",
      paragraphs: [
        "現在のルイス・キャロル方式では、A・Eの全称命題にも主語Xの存在含意があります。",
        "二項命題を三文字図へ置くと、第三項について情報がありません。空条件は二セルの両方へOを置き、存在先が未確定なら二セルの境界へIを置きます。",
        "例：All M are PではM∩P′が空なのでSMpとsMpへO、M∩Pには存在するのでSMPとsMPの境界へIを置きます。",
        "同様にNo M are PならM∩P全体が空なのでSMPとsMPの両セルへO、Some M are PならSかS′か不明なのでSMP／sMP境界へIを置きます。空は領域全体を否定できる一方、存在は第三項の側を勝手に決められないためです。",
      ],
      tables: [{
        caption: "キャロル方式の四命題",
        headers: ["形式", "日本語／英語", "空となる領域", "存在する領域"],
        rows: [
          ["A", "すべてのXはYである / All X are Y", "X∩Y′", "X∩Y"],
          ["E", "いかなるXもYではない / No X are Y", "X∩Y", "X∩Y′"],
          ["I", "あるXはYである / Some X are Y", "なし", "X∩Y"],
          ["O", "あるXはYではない / Some X are not Y", "なし", "X∩Y′"],
        ],
      }],
      ruleSources: [
        { id: "aeio-placement", label: "A・E・I・Oの配置規則", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }, { relation: "direct", sourceId: "symbolic-logic-i-iii-iii-3" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
        { id: "third-term-split", label: "第三項による二セルへの分割", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
      ],
    },
    {
      id: ids[5], heading: "6. 境界上のI駒",
      paragraphs: [
        "境界上のIは自由に好きなセルへ移せません。IがA／B境界にあり、後からAへOが置かれたときだけ、Aは空なのでIをBセル内へ確定できます。",
        "両側にOがなければ境界上のままです。根拠なく片側や別の境界へ移したり、Oのセルへ移したりしてはいけません。",
        "初期状態：IはA／B境界。後からAにO。結果：IをBセル内へ確定。",
      ],
      ruleSources: [
        { id: "boundary-i-resolution", label: "片側が空になった境界Iの確定", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      ],
    },
    {
      id: ids[6], heading: "7. 二つの前提を統合する",
      paragraphs: [
        "統合前提図は第一前提図の駒を動かして作る図ではなく、二つの前提が要求するOとIをすべて反映した完全な図です。",
        "ゲームの第一前提回答と統合前提回答も独立しています。統合前提段階では完全な図を最初から置き直します。",
      ],
      ruleSources: [
        { id: "combine-premises", label: "二つの前提を同じ三文字図へ統合する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
        { id: "manual-redraw-combined", label: "統合前提段階では完全な図を置き直す", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[7], heading: "8. Mを消去して結論図を作る",
      paragraphs: [
        "Mを消去するとは、M／M′の区別を無視して対応する二セルを一つの二文字セルへまとめることです。",
        "Oは二つの元セルが両方空のときだけ結論セルへ置きます。片方だけOなら全体を空とはいえません。存在があれば対応セルへIを写し、M／M′境界のIも同じ二文字セル内へまとまります。",
      ],
      tables: [{
        caption: "中項Mを消去する対応",
        headers: ["三文字図", "二文字結論図"],
        rows: [["SMP と SmP", "SP"], ["SMp と Smp", "Sp"], ["sMP と smP", "sP"], ["sMp と smp", "sp"]],
      }],
      ruleSources: [
        { id: "eliminate-middle", label: "M／M′をまとめて中項を消去する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-i" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
        { id: "project-empty", label: "両方の元セルが空の場合だけOを投影する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
        { id: "project-existence", label: "存在を対応する二文字セルへ投影する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
      ],
    },
    {
      id: ids[8], heading: "9. Barbaraの完全例",
      paragraphs: [
        "第一前提：すべての動物は死すべきものである。第二前提：すべての人間は動物である。割当てはS=人間、M=動物、P=死すべきものです。",
        "第一前提All M are P：OはSMp・sMp、IはSMP／sMPのS境界です。M∩P′は空、M∩Pの存在がSかS′かは未確定だからです。",
        "第二前提All S are MはSmP・Smpを空にし、当初SMP／SMpのP境界にある存在を要求します。SMpは第一前提で空なのでIはSMPへ確定します。",
        "統合図はOがSMp・sMp・SmP・Smp、IがSMP／sMP境界とSMPセルです。MをまとめるとSpへO、SPへIとなり、すべての人間は死すべきものである、を得ます。",
      ],
      ruleSources: [
        { id: "barbara-stages", label: "Barbaraの第一前提・統合前提・結論", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iv-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }, { relation: "derived", sourceId: "symbolic-logic-i-v-ii-2" }] },
      ],
    },
    {
      id: ids[9], heading: "10. 手動配置モードの操作",
      paragraphs: ["ドラッグ＆ドロップは使いません。マウス、タッチ、Tab、Enter、Spaceで操作できます。"],
      lists: [[
        "O、I、消去のいずれかを選ぶ。",
        "セル内または境界上の操作位置を選ぶ。",
        "同じ位置へ別種類を置くと置き換わる。",
        "消去を選んで位置を押すと駒が消える。",
        "「配置を確認」で正誤を確認する。",
        "「この段階の駒をすべて消去」で現在段階だけを空にする。",
        "第一前提と統合前提は別回答で、統合図は完全に置き直す。",
        "結論クイズ使用時は形式正解後に結論図を操作する。正解後の変更は未確認へ戻る。",
      ]],
      ruleSources: [
        { id: "manual-placement-ui", label: "手動配置UI、20／8ターゲット、確認・消去操作", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[10], heading: "11. よくある間違い",
      paragraphs: ["次の誤解を避けてください。"],
      lists: [[
        "S′を反対語と思う → Sではないもの全体です。",
        "境界Iを両セルへの存在と思う → どちらか一方です。",
        "境界Iを根拠なく移す → 片側がOのときだけ確定します。",
        "空条件にOを一つだけ置く → 第三項で分かれた両セルへ置きます。",
        "第一前提図を統合図と思う → 完全図を置き直します。",
        "二つのIを同一対象と思う → 別の存在要求かもしれません。",
        "M消去前に結論図へ移る → まず二前提を統合します。",
        "元セル片方のOだけで結論Oにする → 両方Oが必要です。",
        "Oを命題全体の偽と思う → セルが空という意味です。",
        "Iを数字1と読む → 存在を表す英字Iです。",
      ]],
      ruleSources: [
        { id: "common-error-corrections", label: "よくある間違いの訂正", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
      ],
    },
    {
      id: ids[11], heading: "12. 配置規則の早見表",
      paragraphs: ["印刷・参照用の要約です。"],
      tables: [{
        caption: "配置規則早見表",
        headers: ["分類", "規則"],
        rows: [
          ["記号", "S′=Sでない、M′=Mでない、P′=Pでない"],
          ["駒", "O=セルは空、I=少なくとも一つ存在"],
          ["境界", "境界I=二セルのどちらか。片側Oなら反対側へ確定、両側未確定なら境界のまま"],
          ["結論図", "MとM′をまとめ、両方OならO、存在があれば対応セルへI"],
        ],
      }],
      ruleSources: [
        { id: "quick-reference-summary", label: "配置規則の早見表", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
      ],
    },
  ],
};

export const EN_TUTORIAL_CONTENT: TutorialContent = {
  ...JA_TUTORIAL_CONTENT,
  title: "Counter Placement Tutorial",
  documentTitle: "Counter Placement Tutorial — Lewis Carroll's Logic Game",
  skipLink: "Skip to main content",
  backToGame: "Back to the game",
  languageLabel: "Language",
  contentsLabel: "Tutorial contents",
  notice: "This tutorial explains the Lewis Carroll interpretation currently used by the game.",
  sections: [
    { id: ids[0], heading: "1. Syllogisms and S, M, P", paragraphs: [
      "A syllogism is an argument that combines two premises to derive one conclusion. A Barbara-form example, as used in the game, can be arranged as follows.",
      "A syllogism contains three terms. S is the minor term and becomes the subject of the conclusion (“humans” in this example). P is the major term and becomes its predicate (“mortal beings”). M is the middle term that links the premises (“animals”).",
      "The abstract forms show that M appears in both premises but not in the conclusion. In this game, you combine the premises on a diagram, remove the distinction involving M, and then read the remaining relationship between S and P.",
    ], tables: [{
      caption: "Concrete syllogism and abstract forms",
      headers: ["Stage", "Concrete statement", "Abstract form"],
      rows: [
        ["Premise 1", "All animals are mortal", "All M are P"],
        ["Premise 2", "All humans are animals", "All S are M"],
        ["Conclusion", "All humans are mortal", "All S are P"],
      ],
    }], ruleSources: [] },
    { id: ids[1], heading: "2. S, M, P, and primes", paragraphs: [
      "S′ does not mean an antonym of S. It is the complement of S: everything in the current universe of discourse that is not S.",
      "If S means humans, S′ means non-humans and may include animals, plants, stones, buildings, and every other non-human in the universe.",
      "Nothing is both S and S′, and every object is in one of them. M/M′ and P/P′ divide the universe in the same way.",
      "Lowercase s, m, and p in cell names are internal abbreviations for S′, M′, and P′, not separate terms.",
    ], ruleSources: [
      { id: "complement-terms", label: "S′, M′, and P′ are complements", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-i" }] },
      { id: "lowercase-cell-shorthand", label: "Lowercase s, m, and p cell shorthand", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[2], heading: "3. The eight triliteral regions", paragraphs: ["The three divisions S/S′, M/M′, and P/P′ produce 2 × 2 × 2 = 8 regions."], tables: [{ caption: "Triliteral cell notation", headers: ["Cell", "Full notation", "Meaning"], rows: cellRowsEn }], ruleSources: [
      { id: "eight-triliteral-regions", label: "Eight triliteral regions", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-i" }] },
    ] },
    { id: ids[3], heading: "4. O and I counters", paragraphs: [
      "O means that a cell is empty: no object belongs to that region. Put O inside cells; it is not a general symbol for a false proposition.",
      "I means at least one object exists. Put it inside a cell when exact membership is known, or on a boundary when either of two adjacent cells is possible.",
      "A boundary I does not mean existence in both cells. It means one side or the other, not yet determined. Existential requirements from separate premises need not be the same object and may be visually combined at one position.",
    ], ruleSources: [
      { id: "empty-counter", label: "O marks an empty cell", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      { id: "existence-counter", label: "I marks at least one existing thing", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      { id: "boundary-existence-meaning", label: "A boundary I means existence in either cell", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }] },
    ] },
    { id: ids[4], heading: "5. Placement rules for A, E, I, and O", paragraphs: [
      "Under the Lewis Carroll interpretation used here, universal A and E propositions carry existential import for their subject X.",
      "A two-term proposition says nothing about the third term. An empty region requires O in both split cells; uncertain existence requires I on their boundary.",
      "For All M are P, M∩P′ is empty, so put O in SMp and sMp; M∩P exists, so put I on the S boundary between SMP and sMP.",
      "Likewise, No M are P puts O in both SMP and sMP, while Some M are P puts I on their boundary because S versus S′ is unknown. Emptiness covers the whole region, but existence cannot arbitrarily choose the third-term side.",
    ], tables: [{ caption: "Four proposition forms", headers: ["Form", "Proposition", "Empty", "Existing"], rows: [
      ["A", "All X are Y / すべてのXはYである", "X∩Y′", "X∩Y"],
      ["E", "No X are Y / いかなるXもYではない", "X∩Y", "X∩Y′"],
      ["I", "Some X are Y / あるXはYである", "none", "X∩Y"],
      ["O", "Some X are not Y / あるXはYではない", "none", "X∩Y′"],
    ] }], ruleSources: [
      { id: "aeio-placement", label: "Placement rules for A, E, I, and O", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }, { relation: "direct", sourceId: "symbolic-logic-i-iii-iii-3" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
      { id: "third-term-split", label: "Splitting across two cells by the third term", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
    ] },
    { id: ids[5], heading: "6. Boundary I counters", paragraphs: [
      "A boundary I cannot be moved freely. If I lies between cells A and B and A later receives O, A is empty, so the I becomes fixed inside B.",
      "Without O on either side it remains on the boundary. Never move it without evidence, to another boundary, or into an O cell.",
      "Initially: I on A/B. Later: O in A. Result: I fixed in B.",
    ], ruleSources: [
      { id: "boundary-i-resolution", label: "Resolving boundary I when one side is empty", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
    ] },
    { id: ids[6], heading: "7. Combining two premises", paragraphs: [
      "The combined diagram is not made by moving the first diagram's counters. It is a complete diagram containing every O and I required by both premises.",
      "The game stores first-premise and combined answers separately. In the combined stage, place the complete diagram again from the beginning.",
    ], ruleSources: [
      { id: "combine-premises", label: "Combining two premises on one diagram", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      { id: "manual-redraw-combined", label: "Rebuild the complete combined diagram in manual mode", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[7], heading: "8. Eliminating M for the conclusion", paragraphs: [
      "Eliminating M means ignoring the M/M′ distinction and merging each corresponding pair into one biliteral cell.",
      "Project O only when both source cells are empty; one O is insufficient. Project existence to the corresponding cell. An I across M/M′ becomes an I inside the merged biliteral cell.",
    ], tables: [{ caption: "Projection after eliminating M", headers: ["Triliteral pair", "Biliteral cell"], rows: [["SMP and SmP", "SP"], ["SMp and Smp", "Sp"], ["sMP and smP", "sP"], ["sMp and smp", "sp"]] }], ruleSources: [
      { id: "eliminate-middle", label: "Eliminate M by merging M/M′", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-i" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
      { id: "project-empty", label: "Project O only when both source cells are empty", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
      { id: "project-existence", label: "Project existence to the corresponding biliteral cell", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
    ] },
    { id: ids[8], heading: "9. Complete Barbara example", paragraphs: [
      "Premise 1: All animals are mortal. Premise 2: All humans are animals. S=humans, M=animals, P=mortal beings.",
      "All M are P gives O in SMp and sMp, and I on the S boundary between SMP and sMP: M∩P′ is empty and the existing M∩P object is not yet known to be S or S′.",
      "All S are M adds O in SmP and Smp. Its existence begins on the P boundary between SMP and SMp; because SMp is empty, it becomes fixed in SMP.",
      "The combined diagram has O in SMp, sMp, SmP, Smp and I at the SMP/sMP boundary and in SMP. Eliminating M gives O in Sp and I in SP: All humans are mortal.",
    ], ruleSources: [
      { id: "barbara-stages", label: "Barbara first, combined, and conclusion stages", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iv-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }, { relation: "derived", sourceId: "symbolic-logic-i-v-ii-2" }] },
    ] },
    { id: ids[9], heading: "10. Using manual placement mode", paragraphs: ["There is no drag and drop. Use mouse, touch, Tab, Enter, or Space."], lists: [[
      "Choose O, I, or Erase.", "Activate a cell or boundary target.", "A different counter replaces the old one.", "Erase removes the counter at that target.", "Use Check Placement.", "Clear This Diagram clears only the current stage.", "First and combined answers are separate; rebuild the full combined diagram.", "With the conclusion quiz, answer the form first. Editing a correct diagram returns it to unchecked.",
    ]], ruleSources: [
      { id: "manual-placement-ui", label: "Manual placement UI, 20/8 targets, check, and erase actions", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[10], heading: "11. Common mistakes", paragraphs: ["Correct these common misunderstandings."], lists: [[
      "Treating S′ as an antonym → it is everything not S.", "Treating boundary I as both cells → it means either cell.", "Moving boundary I without evidence → only an O on one side fixes it.", "Using one O for a split empty region → both cells need O.", "Treating the first diagram as combined → rebuild the complete diagram.", "Assuming two I counters are one object → they may be separate requirements.", "Projecting before eliminating M → combine premises first.", "Projecting O from only one source cell → both must be O.", "Treating O as proposition-wide falsity → it marks an empty cell.", "Reading I as digit 1 → it is the letter I for existence.",
    ]], ruleSources: [
      { id: "common-error-corrections", label: "Corrections to common mistakes", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
    ] },
    { id: ids[11], heading: "12. Quick reference", paragraphs: ["A compact reference for printing or review."], tables: [{ caption: "Counter placement quick reference", headers: ["Category", "Rule"], rows: [
      ["Symbols", "S′=not S, M′=not M, P′=not P"], ["Counters", "O=empty cell; I=at least one exists"], ["Boundary", "I means either cell; an O on one side fixes it to the other; otherwise leave it"], ["Conclusion", "Merge M/M′; project O only from two O cells; project any existence to its matching cell"],
    ] }], ruleSources: [
      { id: "quick-reference-summary", label: "Counter placement quick-reference summary", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
    ] },
  ],
};

export function getTutorialContent(locale: Locale): TutorialContent {
  return locale === "ja" ? JA_TUTORIAL_CONTENT : EN_TUTORIAL_CONTENT;
}
