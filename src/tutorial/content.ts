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

export type TutorialBlock =
  | { readonly kind: "paragraph"; readonly text: string }
  | { readonly kind: "subheading"; readonly text: string }
  | { readonly kind: "diagram"; readonly diagramId: string }
  | { readonly kind: "table"; readonly table: TutorialTable }
  | { readonly kind: "list"; readonly ordered?: boolean; readonly items: readonly string[] };

export interface TutorialSectionContent {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly lists?: readonly (readonly string[])[];
  readonly tables?: readonly TutorialTable[];
  readonly blocks?: readonly TutorialBlock[];
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
  readonly bibliography: {
    readonly author: string;
    readonly title: string;
    readonly publication: string;
  };
  readonly sections: readonly TutorialSectionContent[];
}

const ids = [
  "syllogism-basics",
  "syllogism-figures-and-moods",
  "eight-regions",
  "biliteral-diagram",
  "counters",
  "proposition-rules",
  "boundary-existence",
  "barbara",
  "manual-operation",
  "common-mistakes",
  "quick-reference",
] as const;

export const JA_TUTORIAL_CONTENT: TutorialContent = {
  title: "チュートリアル",
  documentTitle: "チュートリアル — ルイス・キャロルの論理ゲーム",
  skipLink: "本文へ移動",
  backToGame: "ゲームへ戻る",
  languageLabel: "言語",
  contentsLabel: "チュートリアルの目次",
  notice: "このチュートリアルでは、ルイス・キャロルの論理ゲームを説明します。",
  bibliography: {
    author: "Lewis Carroll, ",
    title: "Symbolic Logic, Part I: Elementary",
    publication: ", 4th ed., Macmillan, 1897.",
  },
  sections: [
    {
      id: ids[0], heading: "三段論法と項",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "三段論法は、二つの前提を組み合わせて一つの結論を導く推論です。例えば、次のような前提と結論を考えます。" },
        { kind: "paragraph", text: "前提1　すべての動物は死すべきものである。" },
        { kind: "paragraph", text: "前提2　すべての人間は動物である。" },
        { kind: "paragraph", text: "結論　すべての人間は死すべきものである。" },
        { kind: "paragraph", text: "これらの文は、次のように分析できます。" },
        { kind: "paragraph", text: "前提1の主語は「動物」で、述語は「死すべきもの」です。前提2の主語は「人間」で、述語は「動物」です。結論の主語は「人間」で、述語は「死すべきもの」です。" },
        { kind: "paragraph", text: "このような文の主語や述語となる語句を「項」と呼びます。" },
        { kind: "paragraph", text: "結論の主語となる「人間」を小項と呼び、Sで表します。結論の述語となる「死すべきもの」を大項と呼び、Pで表します。二つの前提に現れ、結論には現れない「動物」を中項と呼び、Mで表します。" },
        { kind: "paragraph", text: "この推論は、次のような抽象形で表せます。" },
        { kind: "paragraph", text: "前提1　すべてのMはPである（All M are P）" },
        { kind: "paragraph", text: "前提2　すべてのSはMである（All S are M）" },
        { kind: "paragraph", text: "結論　すべてのSはPである（All S are P）" },
        { kind: "paragraph", text: "「すべてのXはYである」のような文の型を、命題形式と呼びます。" },
        { kind: "paragraph", text: "この抽象形のS・M・Pにどのような項を当てはめても、二つの前提が真であるならば、結論も必ず真になります。このような推論形式を「妥当である」といいます。" },
        { kind: "paragraph", text: "三段論法の妥当性は、文が現実に正しいかどうかではなく、項の配置と命題形式によって決まります。" },
      ],
      ruleSources: [{
        id: "syllogism-terms-validity",
        label: "三段論法の項・命題形式・妥当性の教育的整理",
        sourceReferences: [{ relation: "application", sourceId: null }],
      }],
    },
    {
      id: ids[1], heading: "三段論法の格と命題形式",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "三段論法の妥当性は、三つの項がどの位置に現れるかと、前提および結論がどのような命題形式をもつかによって決まります。" },
        { kind: "paragraph", text: "大項Pを含む前提を大前提、小項Sを含む前提を小前提と呼びます。結論の形は常にS―Pですが、中項Mが二つの前提の主語と述語のどちらに置かれるかには、次の四つの組合せがあります。この項の配置を三段論法の格と呼びます。" },
        { kind: "table", table: {
          caption: "三段論法の四つの格",
          headers: ["格", "大前提", "小前提", "結論"],
          rows: [
            ["第一格", "M―P", "S―M", "S―P"],
            ["第二格", "P―M", "S―M", "S―P"],
            ["第三格", "M―P", "M―S", "S―P"],
            ["第四格", "P―M", "M―S", "S―P"],
          ],
        } },
        { kind: "paragraph", text: "アリストテレスは第四格を独立した格として区別せず、三つの格を用いて三段論法を整理しました。第四格は、後代の論理学において独立した格として整理されたものです。ルイス・キャロルも『記号論理学』では、三段論法を第一格・第二格・第三格の三つに分けています。" },
        { kind: "paragraph", text: "このチュートリアルでは、一般的な三段論法の分類を示すため、第四格も含めた四つの格を掲げます。" },
        { kind: "paragraph", text: "三段論法を構成する個々の命題には、次の四つの命題形式があります。" },
        { kind: "table", table: {
          caption: "A・E・I・Oの命題形式",
          headers: ["記号", "名称", "抽象形", "命題の例"],
          rows: [
            ["A", "全称肯定", "すべてのXはYである", "すべての人間は動物である"],
            ["E", "全称否定", "いかなるXもYではない", "いかなる魚も鳥ではない"],
            ["I", "特称肯定", "あるXはYである", "ある学生は天才である"],
            ["O", "特称否定", "あるXはYではない", "ある学生は天才ではない"],
          ],
        } },
        { kind: "paragraph", text: "大前提、小前提、結論の命題形式をこの順に並べたものを、三段論法の式と呼びます。" },
        { kind: "paragraph", text: "例えば、次の三段論法を考えます。" },
        { kind: "paragraph", text: "大前提　すべてのMはPである。\n小前提　すべてのSはMである。\n結論　すべてのSはPである。" },
        { kind: "paragraph", text: "三つの命題はいずれもA命題なので、この三段論法の式はAAAです。また、中項の配置は第一格であるため、この三段論法全体の形式はAAA-1と表されます。末尾の数字は格を示しています。" },
        { kind: "paragraph", text: "四つの命題形式を大前提、小前提、結論に割り当て、さらに四つの格と組み合わせると、" },
        { kind: "paragraph", text: "4³ × 4 = 256" },
        { kind: "paragraph", text: "通りの三段論法の形式が考えられます。しかし、そのすべてが妥当であるわけではありません。前提が真であっても結論が偽になり得る形式は、妥当ではありません。" },
        { kind: "paragraph", text: "妥当な三段論法の代表的な形式には、伝統的にBarbara、Celarent、Darii、Ferioなどの名前が付けられています。これらの名前に含まれる最初の三つの母音は、大前提、小前提、結論の命題形式を順に表しています。例えば、Barbaraの三つの母音はA・A・Aなので、BarbaraはAAAという式を表します。" },
        { kind: "table", table: {
          caption: "妥当な三段論法の代表的形式",
          headers: ["名称", "形式", "大前提", "小前提", "結論"],
          rows: [
            ["Barbara", "AAA-1", "A", "A", "A"],
            ["Celarent", "EAE-1", "E", "A", "E"],
            ["Darii", "AII-1", "A", "I", "I"],
            ["Ferio", "EIO-1", "E", "I", "O"],
            ["Cesare", "EAE-2", "E", "A", "E"],
          ],
        } },
        { kind: "paragraph", text: "例えば、BarbaraとCesareという名前は、次のように読みます。" },
        { kind: "list", items: [
          "Barbara（AAA-1）：大前提がA、小前提がA、結論がAで、第一格である。",
          "Cesare（EAE-2）：大前提がE、小前提がA、結論がEで、第二格である。",
        ] },
        { kind: "paragraph", text: "CelarentとCesareは、どちらもEAEという同じ式をもちます。しかし、Celarentは第一格、Cesareは第二格です。このことから、A・E・I・Oの組合せだけでなく、中項Mの配置も三段論法の妥当性に関係することが分かります。" },
        { kind: "paragraph", text: "このゲームの組み込み問題では、Barbara（AAA-1）、Celarent（EAE-1）、Darii（AII-1）、Ferio（EIO-1）、Cesare（EAE-2）などを扱います。" },
        { kind: "paragraph", text: "ゲームでは、これらの名前や規則を暗記していなくても問題を解くことができます。二つの前提を図に表し、中項Mを取り除いた後に残るSとPの関係を読み取ることで、その三段論法からどのような結論が導かれるかを確認します。" },
      ],
      ruleSources: [
        { id: "aeio-traditional-forms", label: "A・E・I・Oの伝統的命題形式", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }] },
        { id: "built-in-mood-examples", label: "組み込み問題と代表的形式の対応", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[2], heading: "三文字図と領域",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "キャロルが用いるプライム記号について説明します。" },
        { kind: "paragraph", text: "任意の項Xに対して、X′はXでないものすべてを表します。" },
        { kind: "paragraph", text: "キャロルの記法は現代的な集合記法とは異なりますが、このチュートリアルでは領域を理解しやすくするために集合記法も用います。" },
        { kind: "paragraph", text: "S′は「Sの反対語」ではないことに注意してください。" },
        { kind: "paragraph", text: "XとX′は同時には成立せず、対象領域内のすべての対象は、必ずどちらか一方に属します。したがって、S／S′、M／M′、P／P′は、それぞれ対象領域を二分します。" },
        { kind: "paragraph", text: "キャロルのゲームでは、命題は盤上の駒に変換されます。ゲーム盤は項によって領域に分割されています。このアプリで扱うゲーム盤には、三文字図と二文字図があります。" },
        { kind: "paragraph", text: "三文字図は、三つの項S・M・Pの関係を一つの図に表し、二つの前提から得られる情報を同じ図上で組み合わせるための図です。" },
        { kind: "paragraph", text: "それぞれの項について、その項に属する場合と属さない場合があります。したがって、次の三つの二分ができます。" },
        { kind: "list", items: ["SまたはS′", "MまたはM′", "PまたはP′"] },
        { kind: "paragraph", text: "可能な組合せは2 × 2 × 2 = 8通りなので、三文字図は8つの領域に分かれます。" },
        { kind: "diagram", diagramId: "empty-triliteral" },
        { kind: "paragraph", text: "三文字図は、二つの前提から得られる情報を同じ図上で組み合わせるために使用します。" },
        { kind: "paragraph", text: "結論には中項Mが現れないため、その後はMとM′の区別をまとめ、SとPだけからなる二文字図へ情報を移します。" },
      ],
      ruleSources: [
        { id: "complement-terms", label: "XとX′による領域の二分", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-i" }] },
        { id: "eight-triliteral-regions", label: "三文字図の8領域", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-i" }] },
      ],
    },
    {
      id: ids[3], heading: "二文字図と結論の読み取り",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "キャロルの論理ゲームでは、結論は、小項Sと大項Pの関係を表す二文字図によって表されます。" },
        { kind: "paragraph", text: "二つの前提を三文字図へ反映した後、結論を読み取るためには、中項MとM′の区別をまとめます。結論にはMが現れず、SとPの関係だけが残るためです。" },
        { kind: "paragraph", text: "この操作を「Mの消去」と呼びます。" },
        { kind: "paragraph", text: "Mを消去するとは、M／M′の区別を無視して、対応する二つの三文字図のセルを一つの二文字図のセルへまとめることです。ここで区別を無視するとは、Mに関する情報を捨てるのではなく、MであるかM′であるかという区別を結論では使わないという意味です。" },
        { kind: "paragraph", text: "MかM′かという点だけが異なり、SとPについては同じである二つの三文字図のセルを、一つの二文字図のセルへ対応させます。その結果、8領域の三文字図から4領域の二文字図が得られます。" },
        { kind: "paragraph", text: "例えば、SでありPである二つの領域は、Mに属するかどうかだけが異なります。" },
        { kind: "paragraph", text: "MとM′の区別をまとめると、どちらも二文字図のSP（SでありPである）の領域へ移ります。" },
        { kind: "paragraph", text: "SでありPではない領域、SではなくPである領域、SでもPでもない領域も、同じようにまとめます。" },
        { kind: "diagram", diagramId: "empty-biliteral-basics" },
        { kind: "paragraph", text: "以下では、領域を簡潔に表すため、Sではないものを s と書きます。たとえば Sp は「Sであり、Pではないもの」を表します。p や m も同様です。この小文字表記はCarroll自身の記法ではなく、このアプリで領域を簡潔に説明するための便宜的な記法です。" },
        { kind: "table", table: { caption: "中項Mを消去する対応", headers: ["三文字図", "二文字結論図"], rows: [
          ["SMP と SmP", "SP"], ["SMp と Smp", "Sp"], ["sMP と smP", "sP"], ["sMp と smp", "sp"],
        ] } },
        { kind: "paragraph", text: "二文字図のある領域が空であると判断できるのは、対応する二つの三文字図のセルが両方とも空である場合です。" },
        { kind: "subheading", text: "完全な結論が複数の命題になる場合" },
        { kind: "paragraph", text: "二文字図に複数の独立した情報が確定している場合、完全な結論が二つ以上の命題からなることがあります。" },
        { kind: "paragraph", text: "これは、前提から導ける命題をすべて列挙するという意味ではありません。二文字図に確定した情報を完全に表すため、一つの命題だけでは足りない場合があるということです。" },
        { kind: "subheading", text: "例" },
        { kind: "paragraph", text: "前提" },
        { kind: "list", ordered: false, items: ["すべての S は M である。", "すべての P は M′ である。"] },
        { kind: "paragraph", text: "完全な結論" },
        { kind: "list", ordered: true, items: ["すべての S は P′ である。", "すべての P は S′ である。"] },
        { kind: "paragraph", text: "二つの命題は、どちらもSとPが重ならないという同じ空所情報を含みます。しかし、キャロルの体系では全称肯定命題に存在含意があるため、一つ目はSの存在を、二つ目はPの存在をそれぞれ保持します。一方だけでは二文字図に確定した存在情報の一部が失われるので、二命題を合わせて一つの完全な結論を表します。" },
        { kind: "subheading", text: "ゲームの進行" },
        { kind: "paragraph", text: "本アプリでは、第一前提をM–Pの関係、第二前提をS–Mの関係として扱います。自由問題を作成するときは、この順序に合わせて前提を入力してください。" },
        { kind: "paragraph", text: "M–P、S–Mは項の組合せを示すものであり、主語と述語の向きを指定するものではありません。" },
        { kind: "paragraph", text: "このゲームでは、三文字図と二文字図を次の順に使用します。" },
        { kind: "list", ordered: true, items: ["第一前提を三文字図へ表す", "第二前提を同じ三文字図へ加え、二つの前提を組み合わせる", "MとM′の区別をまとめ、情報を二文字図へ移す", "二文字図に残ったSとPの関係から結論を読み取る"] },
      ],
      ruleSources: [
        { id: "eliminate-middle", label: "M／M′の区別をまとめて二文字図へ移す", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-i" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
        { id: "project-empty", label: "対応する二セルが両方空の場合の投影", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
        { id: "multiple-complete-conclusions", label: "完全な結論が複数の命題を必要とする場合", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-ii-2" }] },
        { id: "complete-vs-incomplete-conclusion", label: "完全な結論と不完全な結論の区別", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-ii-3" }] },
      ],
    },
    {
      id: ids[4], heading: "4. O駒とI駒",
      paragraphs: [
        "O駒は、その領域が空であり、そこに属する対象が一つも存在しないことを示します。",
        "I駒は、その領域に少なくとも一つの対象が存在することを示します。正確なセルが決まっている場合はセル内に置き、隣接する二つのセルのどちらにあるかまでしか分からない場合は、その境界上に置きます。",
        "境界上のI駒は、両方のセルに対象が存在することを意味するのではありません。どちらか一方のセルに対象が存在するものの、どちらであるかがまだ確定していないことを示します。",
        "別々の前提から生じる存在要求は、同じ対象についてのものとは限りません。",
        "同じ位置に複数の存在要求が生じた場合、画面上では一つのI駒にまとめて表示されることがありますが、それらが同一の対象を表すという意味ではありません。",
      ],
      ruleSources: [
        { id: "empty-counter", label: "O駒はセルが空であることを表す", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
        { id: "existence-counter", label: "I駒は少なくとも一つの存在を表す", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
        { id: "boundary-existence-meaning", label: "境界Iは二セルのどちらかに存在する", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }] },
        { id: "counter-display-consolidation", label: "同位置の存在要求を一つのI駒として表示する", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[5], heading: "5. A・E・I・Oの配置規則",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "それぞれの命題形式に対して、どのように駒を置くのかを説明します。" },
        { kind: "subheading", text: "All（すべて）で始まる命題について" },
        { kind: "paragraph", text: "Carrollは、All（すべて）で始まる関係命題を「二重命題（Double Proposition）」として扱います。例えばAll M are Pは、次の二つの情報をあわせたものです。" },
        { kind: "list", ordered: false, items: ["Some M are P", "No M are P′"] },
        { kind: "paragraph", text: "つまり、「MでありPであるものが存在する」という情報と、「MでありPではないものは存在しない」という情報を同時に表します。" },
        { kind: "paragraph", text: "このため、All M are Pを図に表すときには、存在を示すI駒と、空であることを示すO駒の両方を使います。" },
        { kind: "subheading", text: "命題形式ごとの駒の置き方" },
        { kind: "paragraph", text: "全称肯定（All M are P）：" },
        { kind: "paragraph", text: "All M are Pは、No M are P′とSome M are Pの二つの情報として図に表します。" },
        { kind: "paragraph", text: "No M are P′から、M ∩ P′は空なので、SMpとsMpにO駒を置きます。" },
        { kind: "paragraph", text: "Some M are Pから、M ∩ Pには少なくとも一つの対象が存在するので、SMPとsMPの境界上にI駒を置きます。SかS′かはこの命題だけではまだ分からないため、I駒は境界上に置かれます。" },
        { kind: "paragraph", text: "全称否定（No M are P）：" },
        { kind: "paragraph", text: "M ∩ P全体が空なので、SMPとsMPの両方のセルにO駒を置きます。" },
        { kind: "paragraph", text: "特称肯定（Some M are P）：" },
        { kind: "paragraph", text: "対象がSに属するかS′に属するかは分からないため、SMPとsMPの境界上にI駒を置きます。" },
        { kind: "paragraph", text: "特称否定（Some M are not P）：" },
        { kind: "paragraph", text: "対象がSに属するかS′に属するかは分からないため、SMpとsMpの境界上にI駒を置きます。" },
      ],
      tables: [{
        caption: "命題形式と領域の対応",
        headers: ["形式", "日本語／英語", "空となる領域", "存在する領域"],
        rows: [
          ["A", "全称肯定 / All M are P", "O駒：SMp、sMp", "I駒：SMP／sMP境界"],
          ["E", "全称否定 / No M are P", "O駒：SMP、sMP", "なし"],
          ["I", "特称肯定 / Some M are P", "なし", "I駒：SMP／sMP境界"],
          ["O", "特称否定 / Some M are not P", "なし", "I駒：SMp／sMp境界"],
        ],
      }],
      ruleSources: [
        { id: "all-double-proposition", label: "Allで始まる関係命題の二重命題としての構造", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-ii-iii-3" }] },
        { id: "aeio-placement", label: "A・E・I・Oの配置規則", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }, { relation: "direct", sourceId: "symbolic-logic-i-iii-iii-3" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
        { id: "third-term-split", label: "第三項による二セルへの分割", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
        { id: "lowercase-cell-shorthand", label: "セルIDでプライムを小文字として表す", sourceReferences: [{ relation: "application", sourceId: null }] },
      ],
    },
    {
      id: ids[6], heading: "6. 境界上のI駒",
      paragraphs: [
        "境界上のI駒がセル内に確定する条件があります。",
        "境界上のI駒は、隣接する二つのセルのどちらか一方に対象が存在するものの、どちらであるかがまだ分からないことを示しています。",
        "後から一方のセルにO駒が置かれ、そのセルが空であることが分かった場合、対象はもう一方のセルに存在すると分かります。このとき、境界上のI駒をもう一方のセル内へ確定できます。",
        "両方のセルがまだ空でない可能性を残している場合は、どちらに対象が存在するか決められないため、I駒は境界上のままです。",
        "根拠なく一方のセルへ確定したり、別の境界へ移したり、O駒が置かれた空のセルへ移したりすることはできません。",
        "例えば、I駒がSMPとsMPの境界上にあり、後からSMPにO駒が置かれたとします。",
        "SMPは空なので、存在する対象はsMPにあると分かります。したがって、境界上のI駒をsMPのセル内へ確定できます。",
      ],
      ruleSources: [
        { id: "boundary-i-resolution", label: "片側が空になった境界Iの確定", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      ],
    },
    {
      id: ids[7], heading: "7. ゲームによるBarbaraの説明",
      paragraphs: [],
      blocks: [
        { kind: "paragraph", text: "第一前提：すべての動物は死すべきものである。" },
        { kind: "paragraph", text: "第二前提：すべての人間は動物である。" },
        { kind: "paragraph", text: "結論：すべての人間は死すべきものである。" },
        { kind: "paragraph", text: "項への割当ては、S＝人間、M＝動物、P＝死すべきものです。" },
        { kind: "paragraph", text: "第一前提の抽象形は All M are P であり、全称肯定命題です。" },
        { kind: "paragraph", text: "盤上の駒に変換すると、O駒がSMpとsMpに置かれ、I駒がSMPとsMPの境界（S／S′境界）に置かれます。" },
        { kind: "paragraph", text: "なぜなら、M ∩ P′は空であり、M ∩ Pに存在する対象がSに属するかS′に属するかはまだ確定していないからです。" },
        { kind: "paragraph", text: "第二前提の抽象形は All S are M です。" },
        { kind: "paragraph", text: "この前提によってSmPとSmpが空になり、SMPとSMpの境界（P／P′境界）に存在が要求されます。" },
        { kind: "paragraph", text: "SMpは第一前提によってすでに空であるため、この境界上のI駒はSMPのセル内へ確定します。" },
        { kind: "paragraph", text: "二つの前提から得られた情報を合わせると、O駒はSMp・sMp・SmP・Smpに置かれています。" },
        { kind: "paragraph", text: "また、I駒はSMPとsMPの境界上と、SMPのセル内にあります。" },
        { kind: "diagram", diagramId: "barbara-first" },
        { kind: "diagram", diagramId: "barbara-combined" },
        { kind: "diagram", diagramId: "barbara-conclusion" },
        { kind: "paragraph", text: "中項Mを消去してM／M′の区別をまとめると、二文字図ではSpにO駒、SPにI駒が置かれます。" },
        { kind: "table", table: {
          caption: "結論の命題形式と二文字図",
          headers: ["命題形式", "集合としての条件", "二文字図での対応"],
          rows: [
            ["全称肯定（A）All S are P", "S ∩ P′ = ∅、かつキャロル方式では S ∩ P ≠ ∅", "SpにO駒、SPにI駒"],
            ["全称否定（E）No S are P", "S ∩ P = ∅", "SPにO駒"],
            ["特称肯定（I）Some S are P", "S ∩ P ≠ ∅", "SPにI駒"],
            ["特称否定（O）Some S are not P", "S ∩ P′ ≠ ∅", "SpにI駒"],
          ],
        } },
        { kind: "paragraph", text: "この表に照らすと、Spが空であり、SPに対象が存在するので、この二文字図は全称肯定（All S are P）を表します。" },
        { kind: "paragraph", text: "S＝人間、P＝死すべきものなので、「すべての人間は死すべきものである」という結論が得られます。" },
      ],
      ruleSources: [
        { id: "barbara-stages", label: "Barbaraの第一前提・統合前提・結論", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iv-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }, { relation: "derived", sourceId: "symbolic-logic-i-v-ii-2" }] },
      ],
    },
    {
      id: ids[8], heading: "8. 手動配置モードの操作",
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
      id: ids[9], heading: "9. よくある間違い",
      paragraphs: ["次の間違いにご注意ください。"],
      lists: [[
        "S′を反対語と思う → Sではないもの全体です。",
        "境界にあるI駒を両方の領域にある存在と思う → どちらか一方です。",
        "境界にあるI駒を根拠なく移す → 片側にO駒が置かれ、そのセルが空だと分かったときだけ、もう片側へ確定できます。",
        "空条件に対してO駒を一つだけ置く → 第三項によって分かれた両方のセルへ置きます。",
        "二つのI駒を同一対象と思う → 別々の存在要求かもしれません。",
        "三文字図の片方のO駒だけで、二文字図で結論をO駒にする → 対応する二つの三文字図のセルが両方ともO駒である必要があります。",
        "O駒を命題全体の偽と思う → O駒は、そのセルが空であることを示します。",
        "I駒を数字1と読む → 存在を表す英字Iです。",
      ]],
      ruleSources: [
        { id: "common-error-corrections", label: "よくある間違いの訂正", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
      ],
    },
    {
      id: ids[10], heading: "10. 配置規則の早見表",
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
  bibliography: {
    author: "Lewis Carroll, ",
    title: "Symbolic Logic, Part I: Elementary",
    publication: ", 4th ed., Macmillan, 1897.",
  },
  sections: [
    { id: ids[0], heading: "Syllogisms and Terms", paragraphs: [], blocks: [
      { kind: "paragraph", text: "A syllogism is an inference in which a conclusion is derived from two premises. Consider the following example." },
      { kind: "paragraph", text: "Premise 1: All animals are mortal." },
      { kind: "paragraph", text: "Premise 2: All humans are animals." },
      { kind: "paragraph", text: "Conclusion: All humans are mortal." },
      { kind: "paragraph", text: "These propositions can be analysed as follows." },
      { kind: "paragraph", text: "The subject of Premise 1 is “animals,” and its predicate is “mortal.” The subject of Premise 2 is “humans,” and its predicate is “animals.” The subject of the conclusion is “humans,” and its predicate is “mortal.”" },
      { kind: "paragraph", text: "An expression that serves as the subject or predicate of a proposition is called a term." },
      { kind: "paragraph", text: "“Humans,” which is the subject of the conclusion, is called the minor term and is represented by S. “Mortal,” which is the predicate of the conclusion, is called the major term and is represented by P. “Animals,” which occurs in both premises but not in the conclusion, is called the middle term and is represented by M." },
      { kind: "paragraph", text: "The inference can therefore be expressed in the following abstract form." },
      { kind: "paragraph", text: "Premise 1: All M are P." },
      { kind: "paragraph", text: "Premise 2: All S are M." },
      { kind: "paragraph", text: "Conclusion: All S are P." },
      { kind: "paragraph", text: "A pattern such as “All X are Y” is called a proposition form." },
      { kind: "paragraph", text: "No matter which terms are substituted for S, M, and P, if the two premises are true, the conclusion must also be true. An inference form with this property is called valid." },
      { kind: "paragraph", text: "The validity of a syllogism is determined not by whether its sentences are factually true, but by the arrangement of its terms and its proposition forms." },
    ], ruleSources: [{
      id: "syllogism-terms-validity",
      label: "Educational organization of syllogistic terms, proposition forms, and validity",
      sourceReferences: [{ relation: "application", sourceId: null }],
    }] },
    { id: ids[1], heading: "Figures and Proposition Forms of Syllogisms", paragraphs: [], blocks: [
      { kind: "paragraph", text: "The validity of a syllogism depends both on the positions in which its three terms occur and on the proposition forms of its premises and conclusion." },
      { kind: "paragraph", text: "The premise containing the major term P is called the major premise, and the premise containing the minor term S is called the minor premise. The conclusion always has the order S–P. The middle term M, however, can occur as the subject or predicate of the two premises in four different arrangements. These arrangements are called the figures of the syllogism." },
      { kind: "table", table: { caption: "The four figures of syllogisms", headers: ["Figure", "Major premise", "Minor premise", "Conclusion"], rows: [
        ["First figure", "M–P", "S–M", "S–P"], ["Second figure", "P–M", "S–M", "S–P"], ["Third figure", "M–P", "M–S", "S–P"], ["Fourth figure", "P–M", "M–S", "S–P"],
      ] } },
      { kind: "paragraph", text: "Aristotle did not distinguish the fourth figure as an independent figure and organised syllogisms using three figures. The fourth figure was treated as a separate figure by later logicians. Lewis Carroll also classifies syllogisms under the first, second, and third figures in Symbolic Logic." },
      { kind: "paragraph", text: "This tutorial includes the fourth figure in order to show the standard four-figure classification used in later syllogistic logic." },
      { kind: "paragraph", text: "Each proposition in a syllogism has one of the following four forms." },
      { kind: "table", table: { caption: "The A, E, I, and O proposition forms", headers: ["Symbol", "Name", "Abstract form", "Example"], rows: [
        ["A", "Universal affirmative", "All X are Y", "All humans are animals"], ["E", "Universal negative", "No X are Y", "No fish are birds"], ["I", "Particular affirmative", "Some X are Y", "Some students are geniuses"], ["O", "Particular negative", "Some X are not Y", "Some students are not geniuses"],
      ] } },
      { kind: "paragraph", text: "The sequence of the proposition forms of the major premise, minor premise, and conclusion is called the mood of a syllogism." },
      { kind: "paragraph", text: "Consider the following example." },
      { kind: "paragraph", text: "Major premise: All M are P.\nMinor premise: All S are M.\nConclusion: All S are P." },
      { kind: "paragraph", text: "All three propositions have form A, so the mood is AAA. The middle term is arranged according to the first figure, so the complete form of the syllogism is written AAA-1. The number at the end identifies the figure." },
      { kind: "paragraph", text: "Assigning one of the four proposition forms to the major premise, minor premise, and conclusion and combining them with the four figures gives:" },
      { kind: "paragraph", text: "4³ × 4 = 256" },
      { kind: "paragraph", text: "possible syllogistic forms. Not all of them are valid. A form is invalid if its premises can be true while its conclusion is false." },
      { kind: "paragraph", text: "Several traditionally valid forms have names such as Barbara, Celarent, Darii, and Ferio. The first three vowels in each name indicate, in order, the forms of the major premise, minor premise, and conclusion. The three vowels in Barbara are A, A, and A, so Barbara has the mood AAA." },
      { kind: "table", table: { caption: "Representative valid syllogistic forms", headers: ["Name", "Form", "Major premise", "Minor premise", "Conclusion"], rows: [
        ["Barbara", "AAA-1", "A", "A", "A"], ["Celarent", "EAE-1", "E", "A", "E"], ["Darii", "AII-1", "A", "I", "I"], ["Ferio", "EIO-1", "E", "I", "O"], ["Cesare", "EAE-2", "E", "A", "E"],
      ] } },
      { kind: "paragraph", text: "For example, the names Barbara and Cesare can be read as follows." },
      { kind: "list", items: ["Barbara (AAA-1): The major premise is A, the minor premise is A, the conclusion is A, and the syllogism is in the first figure.", "Cesare (EAE-2): The major premise is E, the minor premise is A, the conclusion is E, and the syllogism is in the second figure."] },
      { kind: "paragraph", text: "Celarent and Cesare both have the mood EAE, but Celarent is in the first figure and Cesare is in the second. This shows that validity depends not only on the combination of A, E, I, and O, but also on the position of the middle term M." },
      { kind: "paragraph", text: "The built-in problems in this game include Barbara (AAA-1), Celarent (EAE-1), Darii (AII-1), Ferio (EIO-1), and Cesare (EAE-2)." },
      { kind: "paragraph", text: "Players do not need to memorise these names or rules. By representing the two premises on the diagram, eliminating the distinction involving M, and reading the remaining relation between S and P, they can determine which conclusion follows." },
    ], ruleSources: [
      { id: "aeio-traditional-forms", label: "Traditional A, E, I, and O proposition forms", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }] },
      { id: "built-in-mood-examples", label: "Mapping representative forms to built-in problems", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[2], heading: "Triliteral Diagrams and Regions", paragraphs: [], blocks: [
      { kind: "paragraph", text: "We begin with Carroll's prime notation." },
      { kind: "paragraph", text: "For any term X, X′ represents everything that is not X." },
      { kind: "paragraph", text: "Carroll's notation differs from modern set notation, but this tutorial also uses set notation to make the regions easier to understand." },
      { kind: "paragraph", text: "Note that S′ is not an antonym of S." },
      { kind: "paragraph", text: "X and X′ cannot both apply to the same object, and every object within the universe of discourse belongs to exactly one of them. Thus S/S′, M/M′, and P/P′ each divide the universe of discourse into two regions." },
      { kind: "paragraph", text: "In Carroll's game, propositions are represented by counters on a board. The board is divided into regions by terms. This application uses both triliteral and biliteral diagrams." },
      { kind: "paragraph", text: "A triliteral diagram represents the relations among the three terms S, M, and P on a single diagram. It is used to combine the information provided by the two premises." },
      { kind: "paragraph", text: "For each term, an object either belongs to that term or does not belong to it. We therefore have the following three divisions:" },
      { kind: "list", items: ["S or S′", "M or M′", "P or P′"] },
      { kind: "paragraph", text: "These divisions produce 2 × 2 × 2 = 8 possible combinations, so the triliteral diagram contains eight regions." },
      { kind: "diagram", diagramId: "empty-triliteral" },
      { kind: "paragraph", text: "The triliteral diagram is used to combine the information supplied by the two premises on the same diagram." },
      { kind: "paragraph", text: "Because the middle term M does not occur in the conclusion, the next step merges the M and M′ alternatives and transfers the information to a biliteral diagram involving only S and P." },
    ], ruleSources: [
      { id: "complement-terms", label: "Division into X and X′", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-i" }] },
      { id: "eight-triliteral-regions", label: "Eight triliteral regions", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-i" }] },
    ] },
    { id: ids[3], heading: "The Biliteral Diagram and Reading the Conclusion", paragraphs: [], blocks: [
      { kind: "paragraph", text: "In Carroll's logic game, the conclusion is represented on a biliteral diagram showing the relation between the minor term S and the major term P." },
      { kind: "paragraph", text: "After the two premises have been represented on the triliteral diagram, the distinction between M and M′ is merged in order to read the conclusion. This produces a biliteral diagram, because M does not occur in the conclusion and only the relation between S and P remains." },
      { kind: "paragraph", text: "This operation is called eliminating M." },
      { kind: "paragraph", text: "To eliminate M means to ignore the distinction between M and M′ and combine the corresponding two triliteral cells into a single biliteral cell. Ignoring this distinction does not discard information about M; it means that the conclusion does not use the distinction between being M and being M′." },
      { kind: "paragraph", text: "Two triliteral cells that differ only with respect to M or M′, but are the same with respect to S and P, correspond to one cell of the biliteral diagram. The eight regions of the triliteral diagram are therefore reduced to four regions." },
      { kind: "paragraph", text: "For example, the two regions consisting of things that are both S and P differ only in whether they belong to M." },
      { kind: "paragraph", text: "When the distinction between M and M′ is merged, both regions are transferred to the SP region of the biliteral diagram, the region containing things that are both S and P." },
      { kind: "paragraph", text: "The regions for things that are S but not P, not S but P, and neither S nor P are merged in the same way." },
      { kind: "diagram", diagramId: "empty-biliteral-basics" },
      { kind: "paragraph", text: "For brevity, this tutorial uses lowercase letters to indicate the complementary side of a term. For example, Sp means things that are S but not P. The letters p and m are used in the same way. This lowercase notation is not Carroll's own notation; it is a convenience used in this application to describe diagram regions compactly." },
      { kind: "table", table: { caption: "Eliminating the Middle Term M", headers: ["Triliteral Diagram", "Biliteral Conclusion Diagram"], rows: [
        ["SMP and SmP", "SP"], ["SMp and Smp", "Sp"], ["sMP and smP", "sP"], ["sMp and smp", "sp"],
      ] } },
      { kind: "paragraph", text: "A region of the biliteral diagram is known to be empty only when both corresponding cells of the triliteral diagram are empty." },
      { kind: "subheading", text: "When a Complete Conclusion Needs Multiple Propositions" },
      { kind: "paragraph", text: "When multiple independent pieces of information are determined in the biliteral diagram, the complete conclusion may consist of two or more propositions." },
      { kind: "paragraph", text: "This does not mean that every proposition implied by the premises is listed. Sometimes a single proposition is not enough to express all the definite information in the biliteral diagram." },
      { kind: "subheading", text: "Example" },
      { kind: "paragraph", text: "Premises" },
      { kind: "list", ordered: false, items: ["All S are M.", "All P are M′."] },
      { kind: "paragraph", text: "Complete conclusion" },
      { kind: "list", ordered: true, items: ["All S are P′.", "All P are S′."] },
      { kind: "paragraph", text: "Both propositions contain the same empty-region information that S and P do not overlap. However, in Carroll's system a universal affirmative carries existential import: the first conclusion preserves the existence of S, while the second preserves the existence of P. Either proposition by itself would omit part of the definite existence information in the biliteral diagram, so together they express one complete conclusion." },
      { kind: "subheading", text: "Game Flow" },
      { kind: "paragraph", text: "In this application, the first premise is treated as the relation between M and P, and the second premise as the relation between S and M. When creating a custom problem, enter the premises in this order." },
      { kind: "paragraph", text: "M–P and S–M indicate the pairs of terms in each premise; they do not specify which term must be the subject or predicate." },
      { kind: "paragraph", text: "The game uses the triliteral and biliteral diagrams in the following sequence." },
      { kind: "list", ordered: true, items: ["Represent the first premise on the triliteral diagram.", "Add the second premise to the same diagram and combine the two premises.", "Merge the distinction between M and M′ and transfer the information to the biliteral diagram.", "Read the relation between S and P that remains on the biliteral diagram to obtain the conclusion."] },
    ], ruleSources: [
      { id: "eliminate-middle", label: "Merge M/M′ and transfer to the biliteral diagram", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-i" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
      { id: "project-empty", label: "Project emptiness only from two empty source cells", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iv" }] },
      { id: "multiple-complete-conclusions", label: "A complete conclusion may require multiple propositions", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-ii-2" }] },
      { id: "complete-vs-incomplete-conclusion", label: "Distinguish complete and incomplete conclusions", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-v-ii-3" }] },
    ] },
    { id: ids[4], heading: "4. O and I counters", paragraphs: [
      "An O-counter indicates that a region is empty and that no object belongs to that region.",
      "An I-counter indicates that at least one object exists in a region. When the exact cell is determined, the counter is placed inside that cell. When it is only known that the object belongs to one of two adjacent cells, the counter is placed on the boundary between them.",
      "An I-counter on a boundary does not mean that objects exist in both cells. It means that an object exists in one of the two cells, but it has not yet been determined which one.",
      "Existence requirements arising from different premises do not necessarily concern the same object.",
      "When several existence requirements occur at the same position, the application may display them as a single I-counter, but this does not mean that they represent one and the same object.",
    ], ruleSources: [
      { id: "empty-counter", label: "O marks an empty cell", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      { id: "existence-counter", label: "I marks at least one existing thing", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
      { id: "boundary-existence-meaning", label: "A boundary I means existence in either cell", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iii-ii" }] },
      { id: "counter-display-consolidation", label: "Display co-located existence requirements as one I-counter", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[5], heading: "5. Placement rules for A, E, I, and O", paragraphs: [], blocks: [
      { kind: "paragraph", text: "The following explains how counters are placed for each proposition form." },
      { kind: "subheading", text: "About Propositions Beginning with All" },
      { kind: "paragraph", text: "Carroll treats a proposition of relation beginning with All as a “Double Proposition.” For example, All M are P combines the following two pieces of information:" },
      { kind: "list", ordered: false, items: ["Some M are P", "No M are P′"] },
      { kind: "paragraph", text: "In other words, it states both that at least one thing is both M and P, and that nothing is M but not P." },
      { kind: "paragraph", text: "For this reason, representing All M are P on the diagram requires both an I-counter to indicate existence and O-counters to indicate emptiness." },
      { kind: "subheading", text: "Counter Placement for Each Proposition Form" },
      { kind: "paragraph", text: "Universal affirmative (All M are P):" },
      { kind: "paragraph", text: "All M are P is represented as the two pieces of information No M are P′ and Some M are P." },
      { kind: "paragraph", text: "From No M are P′, M ∩ P′ is empty, so O-counters are placed in SMp and sMp." },
      { kind: "paragraph", text: "From Some M are P, at least one object exists in M ∩ P, so an I-counter is placed on the boundary between SMP and sMP. The proposition alone does not determine whether the object is S or S′, so the I-counter remains on the boundary." },
      { kind: "paragraph", text: "Universal negative (No M are P):" },
      { kind: "paragraph", text: "The whole region M ∩ P is empty, so O-counters are placed in both SMP and sMP." },
      { kind: "paragraph", text: "Particular affirmative (Some M are P):" },
      { kind: "paragraph", text: "It is not known whether the existing object is S or S′, so an I-counter is placed on the boundary between SMP and sMP." },
      { kind: "paragraph", text: "Particular negative (Some M are not P):" },
      { kind: "paragraph", text: "It is not known whether the existing object is S or S′, so an I-counter is placed on the boundary between SMp and sMp." },
    ], tables: [{ caption: "Correspondence Between Proposition Forms and Regions", headers: ["Form", "Proposition", "Empty", "Existing"], rows: [
      ["A", "Universal affirmative / All M are P", "O-counter: SMp, sMp", "I-counter: SMP/sMP boundary"],
      ["E", "Universal negative / No M are P", "O-counter: SMP, sMP", "none"],
      ["I", "Particular affirmative / Some M are P", "none", "I-counter: SMP/sMP boundary"],
      ["O", "Particular negative / Some M are not P", "none", "I-counter: SMp/sMp boundary"],
    ] }], ruleSources: [
      { id: "all-double-proposition", label: "All relation propositions as Double Propositions", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-ii-iii-3" }] },
      { id: "aeio-placement", label: "Placement rules for A, E, I, and O", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-iii-2" }, { relation: "direct", sourceId: "symbolic-logic-i-iii-iii-3" }, { relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
      { id: "third-term-split", label: "Splitting across two cells by the third term", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-ii" }] },
      { id: "lowercase-cell-shorthand", label: "Represent primes as lowercase letters in cell IDs", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[6], heading: "6. Boundary I counters", paragraphs: [
      "There is a condition under which an I-counter on a boundary can be resolved into one of the adjacent cells.",
      "An I-counter on a boundary means that an object exists in one of the two adjacent cells, but it is not yet known which one.",
      "If an O-counter is later placed in one of those cells, that cell is known to be empty. The object must therefore belong to the other cell, and the boundary I-counter can be resolved into that cell.",
      "If both cells remain possible, there is no basis for deciding which cell contains the object, so the I-counter remains on the boundary.",
      "The I-counter cannot be resolved into either cell without a logical reason, moved to a different boundary, or placed in a cell marked empty by an O-counter.",
      "For example, suppose an I-counter is on the boundary between SMP and sMP, and an O-counter is later placed in SMP.",
      "Because SMP is empty, the existing object must be in sMP. The boundary I-counter can therefore be resolved into the sMP cell.",
    ], ruleSources: [
      { id: "boundary-i-resolution", label: "Resolving boundary I when one side is empty", sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }] },
    ] },
    { id: ids[7], heading: "7. Barbara Explained Through the Game", paragraphs: [], blocks: [
      { kind: "paragraph", text: "First premise: All animals are mortal." },
      { kind: "paragraph", text: "Second premise: All humans are animals." },
      { kind: "paragraph", text: "Conclusion: All humans are mortal." },
      { kind: "paragraph", text: "The terms are assigned as S = humans, M = animals, and P = mortal things." },
      { kind: "paragraph", text: "The abstract form of the first premise is All M are P, a universal affirmative proposition." },
      { kind: "paragraph", text: "When this premise is converted into counters on the board, O-counters are placed in SMp and sMp, and an I-counter is placed on the boundary between SMP and sMP, the S/S′ boundary." },
      { kind: "paragraph", text: "This is because M ∩ P′ is empty, while an object exists in M ∩ P but it has not yet been determined whether that object is S or S′." },
      { kind: "paragraph", text: "The abstract form of the second premise is All S are M." },
      { kind: "paragraph", text: "This premise makes SmP and Smp empty and requires existence on the boundary between SMP and SMp, the P/P′ boundary." },
      { kind: "paragraph", text: "Because SMp is already empty as a result of the first premise, this boundary I-counter is resolved into the SMP cell." },
      { kind: "paragraph", text: "When the information from the two premises is combined, O-counters are present in SMp, sMp, SmP, and Smp." },
      { kind: "paragraph", text: "There is also an I-counter on the boundary between SMP and sMP and an I-counter inside the SMP cell." },
      { kind: "diagram", diagramId: "barbara-first" },
      { kind: "diagram", diagramId: "barbara-combined" },
      { kind: "diagram", diagramId: "barbara-conclusion" },
      { kind: "paragraph", text: "When the middle term M is eliminated by merging the distinction between M and M′, the biliteral diagram receives an O-counter in Sp and an I-counter in SP." },
      { kind: "table", table: {
        caption: "Conclusion Forms and the Biliteral Diagram",
        headers: ["Proposition form", "Set condition", "Biliteral diagram"],
        rows: [
          ["Universal affirmative (A) All S are P", "S ∩ P′ = ∅, and in Carroll's system S ∩ P ≠ ∅", "O-counter in Sp; I-counter in SP"],
          ["Universal negative (E) No S are P", "S ∩ P = ∅", "O-counter in SP"],
          ["Particular affirmative (I) Some S are P", "S ∩ P ≠ ∅", "I-counter in SP"],
          ["Particular negative (O) Some S are not P", "S ∩ P′ ≠ ∅", "I-counter in Sp"],
        ],
      } },
      { kind: "paragraph", text: "According to this table, Sp is empty and there is an object in SP, so the biliteral diagram represents the universal affirmative All S are P." },
      { kind: "paragraph", text: "Since S stands for humans and P for mortal things, we obtain the conclusion: “All humans are mortal.”" },
    ], ruleSources: [
      { id: "barbara-stages", label: "Barbara first, combined, and conclusion stages", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iv-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }, { relation: "derived", sourceId: "symbolic-logic-i-v-ii-2" }] },
    ] },
    { id: ids[8], heading: "8. Using manual placement mode", paragraphs: ["There is no drag and drop. Use mouse, touch, Tab, Enter, or Space."], lists: [[
      "Choose O, I, or Erase.", "Activate a cell or boundary target.", "A different counter replaces the old one.", "Erase removes the counter at that target.", "Use Check Placement.", "Clear This Diagram clears only the current stage.", "First and combined answers are separate; rebuild the full combined diagram.", "With the conclusion quiz, answer the form first. Editing a correct diagram returns it to unchecked.",
    ]], ruleSources: [
      { id: "manual-placement-ui", label: "Manual placement UI, 20/8 targets, check, and erase actions", sourceReferences: [{ relation: "application", sourceId: null }] },
    ] },
    { id: ids[9], heading: "9. Common mistakes", paragraphs: ["Watch out for the following common mistakes."], lists: [[
      "Treating S′ as the opposite of S → S′ means everything that is not S.",
      "Treating an I-counter on a boundary as existence in both regions → It means existence in one of the two regions.",
      "Moving an I-counter off a boundary without justification → It can be resolved into the other cell only when one adjacent cell is marked empty by an O-counter.",
      "Placing only one O-counter for an emptiness condition → Place O-counters in both cells produced by the split according to the third term.",
      "Treating two I-counters as referring to the same object → They may represent separate existence requirements.",
      "Using only one O-counter in the triliteral diagram to place an O-counter in the biliteral conclusion → Both corresponding triliteral cells must be marked empty.",
      "Treating an O-counter as meaning that the whole proposition is false → An O-counter means that the cell is empty.",
      "Reading an I-counter as the digit 1 → It is the capital letter I, used to indicate existence.",
    ]], ruleSources: [
      { id: "common-error-corrections", label: "Corrections to common mistakes", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
    ] },
    { id: ids[10], heading: "10. Quick reference", paragraphs: ["A compact reference for printing or review."], tables: [{ caption: "Counter placement quick reference", headers: ["Category", "Rule"], rows: [
      ["Symbols", "S′=not S, M′=not M, P′=not P"], ["Counters", "O=empty cell; I=at least one exists"], ["Boundary", "I means either cell; an O on one side fixes it to the other; otherwise leave it"], ["Conclusion", "Merge M/M′; project O only from two O cells; project any existence to its matching cell"],
    ] }], ruleSources: [
      { id: "quick-reference-summary", label: "Counter placement quick-reference summary", sourceReferences: [{ relation: "derived", sourceId: "symbolic-logic-i-iii-ii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iii" }, { relation: "derived", sourceId: "symbolic-logic-i-iv-iv" }] },
    ] },
  ],
};

export function getTutorialContent(locale: Locale): TutorialContent {
  return locale === "ja" ? JA_TUTORIAL_CONTENT : EN_TUTORIAL_CONTENT;
}
