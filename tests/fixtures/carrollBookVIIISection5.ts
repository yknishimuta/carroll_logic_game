import type { AbstractProposition, ConcreteProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism, ConcreteSyllogism } from "../../src/domain/syllogism";
import type { TermAssignment, TermRole } from "../../src/domain/term";
import { abstractTerm, concreteTerm } from "../../src/domain/term";
import {
  carrollAnswerSource,
  carrollSource,
  type CarrollAnswerSourceMetadata,
  type CarrollSourceMetadata,
} from "../helpers/carrollBookVIII";
import type { CarrollFallacy } from "./carrollBookVIIISection4";

export interface CarrollConcreteDictionary {
  readonly universe: string;
  readonly S: string;
  readonly M: string;
  readonly P: string;
}

export type CarrollSection5Expected =
  | { readonly kind: "conclusion"; readonly propositions: readonly AbstractProposition[] }
  | { readonly kind: "no-conclusion"; readonly fallacy: CarrollFallacy };

export interface CarrollBookVIIISection5Case {
  readonly section: 5;
  readonly number: number;
  readonly source: CarrollSourceMetadata;
  readonly answerSource: CarrollAnswerSourceMetadata;
  readonly sourcePremises: readonly [string, string];
  readonly sourceAnswerText: string;
  readonly dictionary: CarrollConcreteDictionary;
  readonly assignment: TermAssignment;
  readonly concretePremises: ConcreteSyllogism;
  readonly abstractPremises: AbstractSyllogism;
  readonly expected: CarrollSection5Expected;
  readonly expectedConcreteConclusions: readonly ConcreteProposition[];
  readonly verification: {
    readonly answerChecked: true;
    readonly workedSolutionChecked: boolean;
    readonly method: "diagram" | "subscript" | null;
    readonly abstractionDoubleChecked: boolean;
  };
}

type SignedRole = "S" | "S′" | "M" | "M′" | "P" | "P′";
type PropositionSpec = readonly [AbstractProposition["form"], SignedRole, SignedRole];

const LIKE: CarrollFallacy = "like-eliminands-not-asserted-to-exist";
const UNLIKE: CarrollFallacy = "unlike-eliminands-with-entity-premiss";

function occurrence(value: SignedRole) {
  return abstractTerm(value[0] as TermRole, value.endsWith("′"));
}

function proposition([form, subject, predicate]: PropositionSpec): AbstractProposition {
  return { form, subject: occurrence(subject), predicate: occurrence(predicate) };
}

function hasRole(value: AbstractProposition, role: "S" | "P"): boolean {
  return value.subject.role === role || value.predicate.role === role;
}

function normalizePremises(specs: readonly [PropositionSpec, PropositionSpec]): AbstractSyllogism {
  const propositions = specs.map(proposition);
  const firstPremise = propositions.find((value) => hasRole(value, "P"));
  const secondPremise = propositions.find((value) => hasRole(value, "S"));
  if (firstPremise === undefined || secondPremise === undefined) {
    throw new Error("A §5 fixture needs one M/P premise and one S/M premise.");
  }
  return { firstPremise, secondPremise };
}

function concrete(value: AbstractProposition, assignment: TermAssignment): ConcreteProposition {
  return {
    form: value.form,
    subject: concreteTerm(assignment[value.subject.role], value.subject.complemented),
    predicate: concreteTerm(assignment[value.predicate.role], value.predicate.complemented),
  };
}

function section5Case(
  number: number,
  sourcePremises: readonly [string, string],
  dictionary: CarrollConcreteDictionary,
  premiseSpecs: readonly [PropositionSpec, PropositionSpec],
  sourceAnswerText: string,
  expectedSpecs: readonly PropositionSpec[] | CarrollFallacy,
  method: "diagram" | "subscript" | null,
): CarrollBookVIIISection5Case {
  const assignment = {
    S: `carroll-viii-5-${number}-x`,
    M: `carroll-viii-5-${number}-m`,
    P: `carroll-viii-5-${number}-y`,
  } as const;
  const abstractPremises = normalizePremises(premiseSpecs);
  const expected = typeof expectedSpecs === "string"
    ? { kind: "no-conclusion" as const, fallacy: expectedSpecs }
    : { kind: "conclusion" as const, propositions: expectedSpecs.map(proposition) };
  return {
    section: 5,
    number,
    source: carrollSource(5, number),
    answerSource: carrollAnswerSource(5, number),
    sourcePremises,
    sourceAnswerText,
    dictionary,
    assignment,
    abstractPremises,
    concretePremises: {
      firstPremise: concrete(abstractPremises.firstPremise, assignment),
      secondPremise: concrete(abstractPremises.secondPremise, assignment),
    },
    expected,
    expectedConcreteConclusions: expected.kind === "conclusion"
      ? expected.propositions.map((value) => concrete(value, assignment))
      : [],
    verification: {
      answerChecked: true,
      workedSolutionChecked: method !== null,
      method,
      abstractionDoubleChecked: method === null,
    },
  };
}

const d = (universe: string, S: string, M: string, P: string): CarrollConcreteDictionary => ({ universe, S, M, P });
const C = (form: AbstractProposition["form"], subject: SignedRole, predicate: SignedRole): PropositionSpec => [form, subject, predicate];

// Fixed transcriptions from Book VIII §5 Examples and Answers. Nos. 1–12
// were checked against the Diagram Solutions; Nos. 13–24 against the
// Subscript Solutions. x → S, y → P, m → M throughout.
export const CARROLL_BOOK_VIII_SECTION_5 = [
  section5Case(1, ["I have been out for a walk", "I am feeling better"], d("persons", "persons who have been out for a walk", "the Class of I’s", "persons who are feeling better"), [C("A", "M", "S"), C("A", "M", "P")], "Somebody who has been out for a walk is feeling better.", [C("I", "S", "P")], "diagram"),
  section5Case(2, ["No one has read the letter but John", "No one, who has not read it, knows what it is about"], d("persons", "the Class of Johns", "persons who have read the letter", "persons who know what the letter is about"), [C("E", "S′", "M"), C("E", "M′", "P")], "No one but John knows what the letter is about.", [C("E", "S′", "P")], "diagram"),
  section5Case(3, ["Those who are not old like walking", "You and I are young"], d("persons", "persons who like walking", "old persons", "you and I"), [C("A", "M′", "S"), C("A", "P", "M′")], "You and I like walking.", [C("A", "P", "S")], "diagram"),
  section5Case(4, ["Your course is always honest", "Your course is always the best policy"], d("courses", "honest courses", "your course", "courses which are the best policy"), [C("A", "M", "S"), C("A", "M", "P")], "Honesty is sometimes the best policy.", [C("I", "S", "P")], "diagram"),
  section5Case(5, ["No fat creatures run well", "Some greyhounds run well"], d("creatures", "fat creatures", "creatures that run well", "greyhounds"), [C("E", "S", "M"), C("I", "P", "M")], "Some greyhounds are not fat.", [C("I", "P", "S′")], "diagram"),
  section5Case(6, ["Some, who deserve the fair, get their deserts", "None but the brave deserve the fair"], d("persons", "persons who get their deserts", "persons who deserve the fair", "brave persons"), [C("I", "M", "S"), C("E", "P′", "M")], "Some brave persons get their deserts.", [C("I", "P", "S")], "diagram"),
  section5Case(7, ["Some Jews are rich", "All Esquimaux are Gentiles"], d("persons", "rich persons", "Jews", "Esquimaux"), [C("I", "M", "S"), C("A", "P", "M′")], "Some rich persons are not Esquimaux.", [C("I", "S", "P′")], "diagram"),
  section5Case(8, ["Sugar-plums are sweet", "Some sweet things are liked by children"], d("things", "sugar-plums", "sweet things", "things liked by children"), [C("A", "S", "M"), C("I", "M", "P")], "No Concl.", UNLIKE, "diagram"),
  section5Case(9, ["John is in the house", "Everybody in the house is ill"], d("persons", "the Class of Johns", "persons in the house", "ill persons"), [C("A", "S", "M"), C("A", "M", "P")], "John is ill.", [C("A", "S", "P")], "diagram"),
  section5Case(10, ["Umbrellas are useful on a journey", "What is useless on a journey should be left behind"], d("things", "umbrellas", "things useful on a journey", "things that should be left behind"), [C("A", "S", "M"), C("A", "M′", "P")], "Some things, that are not umbrellas, should be left behind on a journey.", [C("I", "S′", "P")], "diagram"),
  section5Case(11, ["Audible music causes vibration in the air", "Inaudible music is not worth paying for"], d("music", "music causing vibration in the air", "audible music", "music worth paying for"), [C("A", "M", "S"), C("A", "M′", "P′")], "No music is worth paying for, unless it causes vibration in the air.", [C("E", "S′", "P")], "diagram"),
  section5Case(12, ["Some holidays are rainy", "Rainy days are tiresome"], d("days", "holidays", "rainy days", "tiresome days"), [C("I", "S", "M"), C("A", "M", "P")], "Some holidays are tiresome.", [C("I", "S", "P")], "diagram"),
  section5Case(13, ["No Frenchmen like plumpudding", "All Englishmen like plumpudding"], d("men", "Frenchmen", "men liking plumpudding", "Englishmen"), [C("E", "S", "M"), C("A", "P", "M")], "Englishmen are not Frenchmen.", [C("A", "P", "S′")], "subscript"),
  section5Case(14, ["No portrait of a lady, that makes her simper or scowl, is satisfactory", "No photograph of a lady ever fails to make her simper or scowl"], d("portraits of ladies", "satisfactory portraits", "portraits making the subject simper or scowl", "photographs"), [C("E", "M", "S"), C("E", "P", "M′")], "No photograph of a lady is satisfactory.", [C("E", "P", "S")], "subscript"),
  section5Case(15, ["All pale people are phlegmatic", "No one looks poetical unless he is pale"], d("people", "phlegmatic people", "pale people", "people looking poetical"), [C("A", "M", "S"), C("E", "M′", "P")], "No one looks poetical unless he is phlegmatic.", [C("E", "S′", "P")], "subscript"),
  section5Case(16, ["No old misers are cheerful", "Some old misers are thin"], d("persons", "cheerful persons", "old misers", "thin persons"), [C("E", "M", "S"), C("I", "M", "P")], "Some thin persons are not cheerful.", [C("I", "P", "S′")], "subscript"),
  section5Case(17, ["No one, who exercises self-control, fails to keep his temper", "Some judges lose their tempers"], d("persons", "persons exercising self-control", "persons keeping their tempers", "judges"), [C("E", "S", "M′"), C("I", "P", "M′")], "Some judges do not exercise self-control.", [C("I", "P", "S′")], "subscript"),
  section5Case(18, ["All pigs are fat", "Nothing that is fed on barley-water is fat"], d("things", "pigs", "fat things", "things fed on barley-water"), [C("A", "S", "M"), C("E", "P", "M")], "Pigs are not fed on barley-water.", [C("A", "S", "P′")], "subscript"),
  section5Case(19, ["All rabbits, that are not greedy, are black", "No old rabbits are free from greediness"], d("rabbits", "black rabbits", "greedy rabbits", "old rabbits"), [C("A", "M′", "S"), C("E", "P", "M′")], "Some black rabbits are not old.", [C("I", "S", "P′")], "subscript"),
  section5Case(20, ["Some pictures are not first attempts", "No first attempts are really good"], d("things", "pictures", "first attempts", "really good things"), [C("I", "S", "M′"), C("E", "M", "P")], "No Concl.", UNLIKE, "subscript"),
  section5Case(21, ["I never neglect important business", "Your business is unimportant"], d("business", "business neglected by me", "important business", "your business"), [C("E", "M", "S"), C("A", "P", "M′")], "No Concl.", LIKE, "subscript"),
  section5Case(22, ["Some lessons are difficult", "What is difficult needs attention"], d("things", "lessons", "difficult things", "things needing attention"), [C("I", "S", "M"), C("A", "M", "P")], "Some lessons need attention.", [C("I", "S", "P")], "subscript"),
  section5Case(23, ["All clever people are popular", "All obliging people are popular"], d("people", "clever people", "popular people", "obliging people"), [C("A", "S", "M"), C("A", "P", "M")], "No Concl.", LIKE, "subscript"),
  section5Case(24, ["Thoughtless people do mischief", "No thoughtful person forgets a promise"], d("persons", "mischievous persons", "thoughtful persons", "persons forgetful of promises"), [C("A", "M′", "S"), C("E", "M", "P")], "No one, who forgets a promise, fails to do mischief.", [C("E", "S′", "P")], "subscript"),
  section5Case(25, ["Pigs cannot fly", "Pigs are greedy"], d("creatures", "greedy creatures", "pigs", "creatures that can fly"), [C("E", "M", "P"), C("A", "M", "S")], "Some greedy creatures cannot fly.", [C("I", "S", "P′")], null),
  section5Case(26, ["All soldiers march well", "Some babies are not soldiers"], d("persons", "babies", "soldiers", "persons who march well"), [C("A", "M", "P"), C("I", "S", "M′")], "No Concl.", UNLIKE, null),
  section5Case(27, ["No bride-cakes are wholesome", "What is unwholesome should be avoided"], d("things", "bride-cakes", "wholesome things", "things that need not be avoided"), [C("E", "S", "M"), C("E", "M′", "P")], "No bride-cakes are things that need not be avoided.", [C("E", "S", "P")], null),
  section5Case(28, ["John is industrious", "No industrious people are unhappy"], d("persons", "the Class of Johns", "industrious people", "happy people"), [C("A", "S", "M"), C("E", "M", "P′")], "John is happy.", [C("A", "S", "P")], null),
  section5Case(29, ["No philosophers are conceited", "Some conceited persons are not gamblers"], d("persons", "persons who are not gamblers", "conceited persons", "philosophers"), [C("E", "P", "M"), C("I", "M", "S")], "Some people, who are not gamblers, are not philosophers.", [C("I", "S", "P′")], null),
  section5Case(30, ["Some excise laws are unjust", "All the laws passed last week relate to excise"], d("laws", "unjust laws", "laws relating to excise", "laws passed last week"), [C("I", "M", "S"), C("A", "P", "M")], "No Concl.", UNLIKE, null),
  section5Case(31, ["No military men write poetry", "None of my lodgers are civilians"], d("men", "my lodgers", "military men", "men who write poetry"), [C("E", "M", "P"), C("E", "S", "M′")], "None of my lodgers write poetry.", [C("E", "S", "P")], null),
  section5Case(32, ["No medicine is nice", "Senna is a medicine"], d("things", "senna", "medicine", "nice things"), [C("E", "M", "P"), C("A", "S", "M")], "Senna is not nice.", [C("A", "S", "P′")], null),
  section5Case(33, ["Some circulars are not read with pleasure", "No begging-letters are read with pleasure"], d("documents", "circulars", "things not read with pleasure", "begging-letters"), [C("I", "S", "M"), C("A", "P", "M")], "No Concl.", UNLIKE, null),
  section5Case(34, ["All Britons are brave", "No sailors are cowards"], d("persons", "Britons", "brave persons", "sailors"), [C("A", "S", "M"), C("A", "P", "M")], "No Concl.", LIKE, null),
  section5Case(35, ["Nothing intelligible ever puzzles me", "Logic puzzles me"], d("things", "logic", "things that puzzle me", "intelligible things"), [C("E", "P", "M"), C("A", "S", "M")], "Logic is unintelligible.", [C("A", "S", "P′")], null),
  section5Case(36, ["Some pigs are wild", "All pigs are fat"], d("creatures", "wild creatures", "pigs", "fat creatures"), [C("I", "M", "S"), C("A", "M", "P")], "Some wild creatures are fat.", [C("I", "S", "P")], null),
  section5Case(37, ["All wasps are unfriendly", "All unfriendly creatures are unwelcome"], d("creatures", "wasps", "unfriendly creatures", "unwelcome creatures"), [C("A", "S", "M"), C("A", "M", "P")], "All wasps are unwelcome.", [C("A", "S", "P")], null),
  section5Case(38, ["No old rabbits are greedy", "All black rabbits are greedy"], d("rabbits", "black rabbits", "greedy rabbits", "old rabbits"), [C("E", "P", "M"), C("A", "S", "M")], "All black rabbits are young.", [C("A", "S", "P′")], null),
  section5Case(39, ["Some eggs are hard-boiled", "No eggs are uncrackable"], d("things", "hard-boiled things", "eggs", "things that can be cracked"), [C("I", "M", "S"), C("E", "M", "P′")], "Some hard-boiled things can be cracked.", [C("I", "S", "P")], null),
  section5Case(40, ["No antelope is ungraceful", "Graceful creatures delight the eye"], d("creatures", "antelopes", "graceful creatures", "creatures that delight the eye"), [C("E", "S", "M′"), C("A", "M", "P")], "No antelopes fail to delight the eye.", [C("E", "S", "P′")], null),
  section5Case(41, ["All well-fed canaries sing loud", "No canary is melancholy if it sings loud"], d("canaries", "well-fed canaries", "canaries that sing loud", "melancholy canaries"), [C("A", "S", "M"), C("E", "M", "P")], "All well-fed canaries are cheerful.", [C("A", "S", "P′")], null),
  section5Case(42, ["Some poetry is original", "No original work is producible at will"], d("works", "poetry", "original works", "works producible at will"), [C("I", "S", "M"), C("E", "M", "P")], "Some poetry is not producible at will.", [C("I", "S", "P′")], null),
  section5Case(43, ["No country, that has been explored, is infested by dragons", "Unexplored countries are fascinating"], d("countries", "countries infested by dragons", "explored countries", "fascinating countries"), [C("E", "M", "S"), C("A", "M′", "P")], "No country infested by dragons fails to be fascinating.", [C("E", "S", "P′")], null),
  section5Case(44, ["No coals are white", "No niggers are white"], d("things", "coals", "white things", "niggers"), [C("E", "S", "M"), C("E", "P", "M")], "No Concl.", LIKE, null),
  section5Case(45, ["No bridges are made of sugar", "Some bridges are picturesque"], d("things", "picturesque things", "bridges", "things made of sugar"), [C("E", "M", "P"), C("I", "M", "S")], "Some picturesque things are not made of sugar.", [C("I", "S", "P′")], null),
  section5Case(46, ["No children are patient", "No impatient person can sit still"], d("persons", "children", "patient persons", "persons who can sit still"), [C("E", "S", "M"), C("E", "M′", "P")], "No children can sit still.", [C("E", "S", "P")], null),
  section5Case(47, ["No quadrupeds can whistle", "Some cats are quadrupeds"], d("creatures", "cats", "quadrupeds", "creatures that can whistle"), [C("E", "M", "P"), C("I", "S", "M")], "Some cats cannot whistle.", [C("I", "S", "P′")], null),
  section5Case(48, ["Bores are terrible", "You are a bore"], d("persons", "you", "bores", "terrible persons"), [C("A", "M", "P"), C("A", "S", "M")], "You are terrible.", [C("A", "S", "P")], null),
  section5Case(49, ["Some oysters are silent", "No silent creatures are amusing"], d("creatures", "oysters", "silent creatures", "amusing creatures"), [C("I", "S", "M"), C("E", "M", "P")], "Some oysters are not amusing.", [C("I", "S", "P′")], null),
  section5Case(50, ["There are no Jews in the house", "No Gentiles have beards a yard long"], d("persons", "persons in the house", "Jews", "persons with beards a yard long"), [C("E", "S", "M"), C("E", "M′", "P")], "Nobody in the house has a beard a yard long.", [C("E", "S", "P")], null),
  section5Case(51, ["Canaries, that do not sing loud, are unhappy", "No well-fed canaries fail to sing loud"], d("canaries", "ill-fed canaries", "canaries that sing loud", "unhappy canaries"), [C("A", "M′", "P"), C("E", "S′", "M′")], "Some ill-fed canaries are unhappy.", [C("I", "S", "P")], null),
  section5Case(52, ["All my sisters have colds", "No one can sing who has a cold"], d("persons", "my sisters", "persons with colds", "persons who can sing"), [C("A", "S", "M"), C("E", "M", "P")], "My sisters cannot sing.", [C("A", "S", "P′")], null),
  section5Case(53, ["All that is made of gold is precious", "Some caskets are precious"], d("things", "things made of gold", "precious things", "caskets"), [C("A", "S", "M"), C("I", "P", "M")], "No Concl.", UNLIKE, null),
  section5Case(54, ["Some buns are rich", "All buns are nice"], d("things", "rich things", "buns", "nice things"), [C("I", "M", "S"), C("A", "M", "P")], "Some rich things are nice.", [C("I", "S", "P")], null),
  section5Case(55, ["All my cousins are unjust", "All judges are just"], d("persons", "my cousins", "just persons", "judges"), [C("A", "S", "M′"), C("A", "P", "M")], "My cousins are none of them judges, and judges are none of them cousins of mine.", [C("A", "S", "P′"), C("A", "P", "S′")], null),
  section5Case(56, ["Pain is wearisome", "No pain is eagerly wished for"], d("things", "wearisome things", "pain", "things eagerly wished for"), [C("A", "M", "S"), C("E", "M", "P")], "Something wearisome is not eagerly wished for.", [C("I", "S", "P′")], null),
  section5Case(57, ["All medicine is nasty", "Senna is a medicine"], d("things", "senna", "medicine", "nasty things"), [C("A", "M", "P"), C("A", "S", "M")], "Senna is nasty.", [C("A", "S", "P")], null),
  section5Case(58, ["Some unkind remarks are annoying", "No critical remarks are kind"], d("remarks", "annoying remarks", "unkind remarks", "critical remarks"), [C("I", "M", "S"), C("A", "P", "M")], "No Concl.", UNLIKE, null),
  section5Case(59, ["No tall men have woolly hair", "Niggers have woolly hair"], d("men", "niggers", "men with woolly hair", "tall men"), [C("E", "P", "M"), C("A", "S", "M")], "Niggers are not any of them tall.", [C("A", "S", "P′")], null),
  section5Case(60, ["All philosophers are logical", "An illogical man is always obstinate"], d("men", "obstinate men", "logical men", "philosophers"), [C("A", "P", "M"), C("A", "M′", "S")], "Some obstinate persons are not philosophers.", [C("I", "S", "P′")], null),
  section5Case(61, ["John is industrious", "All industrious people are happy"], d("persons", "the Class of Johns", "industrious people", "happy people"), [C("A", "S", "M"), C("A", "M", "P")], "John is happy.", [C("A", "S", "P")], null),
  section5Case(62, ["These dishes are all well-cooked", "Some dishes are unwholesome if not well-cooked"], d("dishes", "unwholesome dishes", "well-cooked dishes", "these dishes"), [C("A", "P", "M"), C("I", "M′", "S")], "Some unwholesome dishes are not present here (i.e. cannot be spoken of as “these”).", [C("I", "S", "P′")], null),
  section5Case(63, ["No exciting books suit feverish patients", "Unexciting books make one drowsy"], d("books", "books suiting feverish patients", "exciting books", "books making one drowsy"), [C("E", "M", "S"), C("A", "M′", "P")], "No books suit feverish patients unless they make one drowsy.", [C("E", "S", "P′")], null),
  section5Case(64, ["No pigs can fly", "All pigs are greedy"], d("creatures", "greedy creatures", "pigs", "creatures that can fly"), [C("E", "M", "P"), C("A", "M", "S")], "Some greedy creatures cannot fly.", [C("I", "S", "P′")], null),
  section5Case(65, ["When a man knows what he’s about, he can detect a sharper", "You and I know what we’re about"], d("persons", "you and I", "persons who know what they are about", "persons who can detect a sharper"), [C("A", "M", "P"), C("A", "S", "M")], "You and I can detect a sharper.", [C("A", "S", "P")], null),
  section5Case(66, ["Some dreams are terrible", "No lambs are terrible"], d("things", "dreams", "terrible things", "lambs"), [C("I", "S", "M"), C("E", "P", "M")], "Some dreams are not lambs.", [C("I", "S", "P′")], null),
  section5Case(67, ["No bald creature needs a hairbrush", "No lizards have hair"], d("creatures", "lizards", "bald creatures", "creatures needing a hairbrush"), [C("E", "M", "P"), C("E", "S", "M′")], "No lizard needs a hairbrush.", [C("E", "S", "P")], null),
  section5Case(68, ["All battles are noisy", "What makes no noise may escape notice"], d("things", "things that may escape notice", "noisy things", "battles"), [C("A", "P", "M"), C("A", "M′", "S")], "Some things, that may escape notice, are not battles.", [C("I", "S", "P′")], null),
  section5Case(69, ["All my cousins are unjust", "No judges are unjust"], d("persons", "my cousins", "unjust persons", "judges"), [C("A", "S", "M"), C("E", "P", "M")], "My cousins are not any of them judges.", [C("A", "S", "P′")], null),
  section5Case(70, ["All eggs can be cracked", "Some eggs are hard-boiled"], d("things", "hard-boiled things", "eggs", "things that can be cracked"), [C("A", "M", "P"), C("I", "M", "S")], "Some hard-boiled things can be cracked.", [C("I", "S", "P")], null),
  section5Case(71, ["Prejudiced persons are untrustworthy", "Some unprejudiced persons are disliked"], d("persons", "disliked persons", "prejudiced persons", "untrustworthy persons"), [C("A", "M", "P"), C("I", "M′", "S")], "No Concl.", UNLIKE, null),
  section5Case(72, ["No dictatorial person is popular", "She is dictatorial"], d("persons", "the Class represented by ‘she’", "dictatorial persons", "popular persons"), [C("E", "M", "P"), C("A", "S", "M")], "She is unpopular.", [C("A", "S", "P′")], null),
  section5Case(73, ["Some bald people wear wigs", "All your children have hair"], d("persons", "people who wear wigs", "bald people", "your children"), [C("I", "M", "S"), C("A", "P", "M′")], "Some people, who wear wigs, are not children of yours.", [C("I", "S", "P′")], null),
  section5Case(74, ["No lobsters are unreasonable", "No reasonable creatures expect impossibilities"], d("creatures", "lobsters", "reasonable creatures", "creatures expecting impossibilities"), [C("E", "S", "M′"), C("E", "M", "P")], "No lobsters expect impossibilities.", [C("E", "S", "P")], null),
  section5Case(75, ["No nightmare is pleasant", "Unpleasant experiences are not eagerly desired"], d("experiences", "nightmares", "pleasant experiences", "experiences eagerly desired"), [C("E", "S", "M"), C("E", "M′", "P")], "No nightmare is eagerly desired.", [C("E", "S", "P")], null),
  section5Case(76, ["No plumcakes are wholesome", "Some wholesome things are nice"], d("things", "nice things", "wholesome things", "plumcakes"), [C("E", "P", "M"), C("I", "M", "S")], "Some nice things are not plumcakes.", [C("I", "S", "P′")], null),
  section5Case(77, ["Nothing that is nice need be shunned", "Some kinds of jam are nice"], d("things", "kinds of jam", "nice things", "things needing to be shunned"), [C("E", "M", "P"), C("I", "S", "M")], "Some kinds of jam need not be shunned.", [C("I", "S", "P′")], null),
  section5Case(78, ["All ducks waddle", "Nothing that waddles is graceful"], d("creatures", "ducks", "creatures that waddle", "graceful creatures"), [C("A", "S", "M"), C("E", "M", "P")], "All ducks are ungraceful.", [C("A", "S", "P′")], null),
  section5Case(79, ["Sandwiches are satisfying", "Nothing in this dish is unsatisfying"], d("things", "sandwiches", "satisfying things", "things in this dish"), [C("A", "S", "M"), C("A", "P", "M")], "No Concl.", LIKE, null),
  section5Case(80, ["No rich man begs in the street", "Those who are not rich should keep accounts"], d("men", "men who beg in the street", "rich men", "men who should keep accounts"), [C("E", "M", "S"), C("A", "M′", "P")], "No man, who begs in the street, should fail to keep accounts.", [C("E", "S", "P′")], null),
  section5Case(81, ["Spiders spin webs", "Some creatures, that do not spin webs, are savage"], d("creatures", "savage creatures", "creatures that spin webs", "spiders"), [C("A", "P", "M"), C("I", "M′", "S")], "Some savage creatures are not spiders.", [C("I", "S", "P′")], null),
  section5Case(82, ["Some of these shops are not crowded", "No crowded shops are comfortable"], d("shops", "these shops", "crowded shops", "comfortable shops"), [C("I", "S", "M′"), C("E", "M", "P")], "No Concl.", UNLIKE, null),
  section5Case(83, ["Prudent travelers carry plenty of small change", "Imprudent travelers lose their luggage"], d("travelers", "travelers not carrying plenty of small change", "prudent travelers", "travelers who lose their luggage"), [C("E", "M", "S"), C("A", "M′", "P")], "No travelers, who do not carry plenty of small change, fail to lose their luggage.", [C("E", "S", "P′")], null),
  section5Case(84, ["Some geraniums are red", "All these flowers are red"], d("flowers", "geraniums", "red flowers", "these flowers"), [C("I", "S", "M"), C("A", "P", "M")], "No Concl.", UNLIKE, null),
  section5Case(85, ["None of my cousins are just", "All judges are just"], d("persons", "my cousins", "just persons", "judges"), [C("E", "S", "M"), C("A", "P", "M")], "Judges are none of them cousins of mine.", [C("A", "P", "S′")], null),
  section5Case(86, ["No Jews are mad", "All my lodgers are Jews"], d("persons", "my lodgers", "Jews", "mad persons"), [C("E", "M", "P"), C("A", "S", "M")], "All my lodgers are sane.", [C("A", "S", "P′")], null),
  section5Case(87, ["Busy folk are not always talking about their grievances", "Discontented folk are always talking about their grievances"], d("persons", "busy folk", "persons always talking about their grievances", "discontented folk"), [C("A", "S", "M′"), C("A", "P", "M")], "Those who are busy are contented, and discontented people are not busy.", [C("A", "S", "P′"), C("A", "P", "S′")], null),
  section5Case(88, ["None of my cousins are just", "No judges are unjust"], d("persons", "my cousins", "just persons", "judges"), [C("E", "S", "M"), C("E", "P", "M′")], "None of my cousins are judges.", [C("E", "S", "P")], null),
  section5Case(89, ["All teetotalers like sugar", "No nightingale drinks wine"], d("creatures", "nightingales", "creatures that drink wine", "creatures that like sugar"), [C("A", "M′", "P"), C("E", "S", "M")], "No nightingale dislikes sugar.", [C("E", "S", "P′")], null),
  section5Case(90, ["No riddles interest me if they can be solved", "All these riddles are insoluble"], d("riddles", "riddles that interest me", "soluble riddles", "these riddles"), [C("E", "M", "S"), C("A", "P", "M′")], "No Concl.", LIKE, null),
  section5Case(91, ["All clear explanations are satisfactory", "Some excuses are unsatisfactory"], d("things", "excuses", "satisfactory things", "clear explanations"), [C("A", "P", "M"), C("I", "S", "M′")], "Some excuses are not clear explanations.", [C("I", "S", "P′")], null),
  section5Case(92, ["All elderly ladies are talkative", "All good-tempered ladies are talkative"], d("ladies", "elderly ladies", "talkative ladies", "good-tempered ladies"), [C("A", "S", "M"), C("A", "P", "M")], "No Concl.", LIKE, null),
  section5Case(93, ["No kind deed is unlawful", "What is lawful may be done without scruple"], d("deeds", "kind deeds", "lawful deeds", "deeds that may be done without scruple"), [C("E", "S", "M′"), C("A", "M", "P")], "No kind deed need cause scruple.", [C("E", "S", "P′")], null),
  section5Case(94, ["No babies are studious", "No babies are good violinists"], d("persons", "studious persons", "babies", "good violinists"), [C("E", "M", "S"), C("E", "M", "P")], "No Concl.", LIKE, null),
  section5Case(95, ["All shillings are round", "All these coins are round"], d("coins", "shillings", "round coins", "these coins"), [C("A", "S", "M"), C("A", "P", "M")], "No Concl.", LIKE, null),
  section5Case(96, ["No honest men cheat", "No dishonest men are trustworthy"], d("men", "cheats", "honest men", "trustworthy men"), [C("E", "M", "S"), C("E", "M′", "P")], "No cheats are trustworthy.", [C("E", "S", "P")], null),
  section5Case(97, ["None of my boys are clever", "None of my girls are greedy"], d("children of mine", "clever children", "boys", "greedy children"), [C("E", "M", "S"), C("E", "M′", "P")], "No clever child of mine is greedy.", [C("E", "S", "P")], null),
  section5Case(98, ["All jokes are meant to amuse", "No Act of Parliament is a joke"], d("things", "things meant to amuse", "jokes", "Acts of Parliament"), [C("A", "M", "S"), C("E", "P", "M")], "Some things, that are meant to amuse, are not Acts of Parliament.", [C("I", "S", "P′")], null),
  section5Case(99, ["No eventful tour is ever forgotten", "Uneventful tours are not worth writing a book about"], d("tours", "tours ever forgotten", "eventful tours", "tours worth writing a book about"), [C("E", "M", "S"), C("A", "M′", "P′")], "No tour, that is ever forgotten, is worth writing a book about.", [C("E", "S", "P")], null),
  section5Case(100, ["All my boys are disobedient", "All my girls are discontented"], d("children of mine", "obedient children", "boys", "contented children"), [C("A", "M", "S′"), C("A", "M′", "P′")], "No obedient child of mine is contented.", [C("E", "S", "P")], null),
  section5Case(101, ["No unexpected pleasure annoys me", "Your visit is an unexpected pleasure"], d("things", "your visit", "unexpected pleasures", "things that annoy me"), [C("E", "M", "P"), C("A", "S", "M")], "Your visit does not annoy me.", [C("A", "S", "P′")], null),
] as const satisfies readonly CarrollBookVIIISection5Case[];
