# Tutorial source map

## Source and locator policy

- Work: Lewis Carroll, *Symbolic Logic, Part I: Elementary*
- Edition: Fourth Edition, Macmillan and Co., 1897
- Digital copy: Project Gutenberg EBook #28696, stored locally as
  `Symbolic Logic.pdf`
- Verification date: 2026-07-26
- Locator format: `I.<Book>.<Chapter>[.<Section>]`. Thus `I.IV.III`
  means Part I, Book IV, Chapter III, and `I.V.II.2` adds §2.
- The stable chapter locator is primary. `Page` is the printed page shown
  by the edition, not the PDF viewer page.
- `direct` means the rule is stated or demonstrated at that location.
  `derived` means the tutorial organizes a result by applying verified
  rules from those locations. `application` means behavior of this app and
  has no source locator.
- No unverified chapter number is entered. A rule awaiting source research
  must use `—`, relation `unverified`, and verified `no`.

## Rule mapping

| Rule ID | Description | Source ID / locator | Relation | Page | Verified |
|---|---|---|---|---:|---|
| syllogism-terms-validity | Tutorial organization of syllogistic terms, proposition forms, and validity | — | application | — | yes |
| syllogism-figures | Four-figure classification and historical account of Aristotle, later logicians, and Carroll | — | unverified | — | no |
| aeio-traditional-forms | Tutorial table organizing the traditional A, E, I, and O proposition forms | symbolic-logic-i-iii-iii-2 / I.III.III.2 | derived | 28 | yes |
| traditional-mood-names | Mood notation and the traditional names Barbara, Celarent, Darii, Ferio, and Cesare | — | unverified | — | no |
| built-in-mood-examples | Mapping representative named forms to this app's built-in problem catalog | — | application | — | yes |
| complement-terms | x′ means not-x within the universe; applied to S′, M′, P′ | symbolic-logic-i-iii-i / I.III.I | direct | 22 | yes |
| lowercase-cell-shorthand | This app abbreviates S′, M′, P′ as lowercase s, m, p in cell IDs | — | application | — | yes |
| eight-triliteral-regions | Third division creates the eight triliteral cells | symbolic-logic-i-iv-i / I.IV.I | direct | 39 | yes |
| empty-counter | O denotes an empty cell; Carroll uses a grey counter and later digit O | symbolic-logic-i-iii-ii / I.III.II; symbolic-logic-i-iv-iii / I.IV.III | direct | 26; 50 | yes |
| existence-counter | I denotes at least one existing thing; Carroll uses a red counter and later digit I | symbolic-logic-i-iii-ii / I.III.II; symbolic-logic-i-iv-iii / I.IV.III | direct | 26; 50 | yes |
| boundary-existence-meaning | A counter on a partition means at least one of the two cells is occupied | symbolic-logic-i-iii-ii / I.III.II | direct | 26 | yes |
| counter-display-consolidation | Co-located existence requirements may share one displayed I-counter without identifying their objects | — | application | — | yes |
| aeio-placement | Tutorial table consolidating existential and relation-proposition representations | I.III.III.2; I.III.III.3; I.IV.II | derived/direct | 28; 30; 43 | yes |
| third-term-split | A two-term proposition occupies or empties a compartment split into two cells | symbolic-logic-i-iv-ii / I.IV.II | direct | 43 | yes |
| boundary-i-resolution | A boundary I resolves into the remaining candidate cell when the other cell is made empty | symbolic-logic-i-iv-iii / I.IV.III | direct | 50 | yes |
| combine-premises | Two propositions are represented on the same triliteral diagram | symbolic-logic-i-iv-iii / I.IV.III | direct | 50 | yes |
| manual-redraw-combined | Manual mode keeps first and combined answers separate and redraws the full diagram | — | application | — | yes |
| eliminate-middle | Eliminands disappear from the conclusion; transfer to a biliteral diagram | I.V.I; I.IV.IV | direct | 56; 53 | yes |
| project-empty | A biliteral quarter receives O only if both source cells contain O | symbolic-logic-i-iv-iv / I.IV.IV | direct | 53 | yes |
| project-existence | A biliteral quarter receives I if either source cell contains I | symbolic-logic-i-iv-iv / I.IV.IV | direct | 53 | yes |
| barbara-stages | Barbara worked by the verified general representation, combination, projection, and syllogism rules | I.IV.II; I.IV.III; I.IV.IV; I.V.II.2 | derived | 43; 50; 53; 60 | yes |
| manual-placement-ui | O/I/erase tools, 20/8 targets, checking, clearing, and keyboard behavior | — | application | — | yes |
| common-error-corrections | Tutorial summary of verified counter, boundary, and projection rules | I.III.II; I.IV.III; I.IV.IV | derived | 26; 50; 53 | yes |
| quick-reference-summary | Compact summary of verified counter, boundary, and projection rules | I.III.II; I.IV.III; I.IV.IV | derived | 26; 50; 53 | yes |

## Deliberately unassigned source locators

- The `biliteral-diagram` overview reuses the verified `eliminate-middle` and
  `project-empty` mappings; its game-flow wording is
  an educational organization and introduces no new locator.
- The first section's modern-language explanation of terms, proposition forms,
  and validity is an educational organization by this app.
- The historical four-figure account and the traditional mood-name summary in
  section 2 remain unverified; no guessed Carroll locator or page is assigned.
- Lowercase `s`, `m`, `p` cell IDs are application notation, not Carroll's
  printed prime notation. They remain an internal implementation detail and
  are not taught by the merged `eight-regions` tutorial section.
- The `eight-regions` section combines the verified `complement-terms` and
  `eight-triliteral-regions` mappings. No locator or page was changed.
- The exact 20 triliteral and 8 biliteral interactive target sets, tool
  replacement, clear/check actions, quiz unlocking, and answer-state
  behavior are application behavior.
- The tutorial's specific modern-language Barbara example is a derived
  application of the verified method. It is not claimed to be a verbatim
  worked example at a guessed chapter.
