# Politiskel

Discover your political skeleton.

Politiskel places political profiles on several readings of the political
space — economic left/right against libertarian/authoritarian by default —
compares them against the parties of a chosen country, and breaks each profile
down axis by axis, so a group can see where it actually diverges rather than
only where its average sits.

A profile comes from a [PolitiScales](https://politiscales.fr) result, from
Politiskel's own questionnaire, or from both: the questionnaire can complete a
PolitiScales profile, or start one from nothing.

## Direction

- **A native test is the goal.** Answering inside Politiskel, no detour and no
  import. The first theme, the economy, exists; society, Europe and the world,
  ecology and institutions are planned, each with its counterpart in CHES so
  its readings stay comparable to the parties.
- **PolitiScales import stays.** It is the fastest way to a real profile today,
  and nobody who already took that test should have to retake anything.
- **Other questionnaires are plausible.** Not implemented.

Only two things are genuinely tied to PolitiScales: `tools/politi-dissect.js`,
which reads its screenshot layout, and the `AXES` table in
`tools/politi-model.js`. The questionnaire lives beside them in
`tools/politi-quiz.js`.
Adding another questionnaire is mostly declaring its axes and writing an
importer.

## Privacy

Politiskel runs entirely on your machine — no server, no account, no tracker.

The repository holds code, never profiles. `template.html` is the application
with an empty data slot; the build fills it and writes the page you open. Since
that page is rebuilt on every run, it cannot accumulate data across versions.
Everything derived from your answers is ignored by git — see `.gitignore`.
Questionnaire answers never reach a file at all: they stay in the browser's
storage for this page.

## Usage

Requires Node, with no dependencies. `tesseract` is optional; without it mottos
are skipped.

1. Drop PolitiScales screenshots into `politi-results/`, named
   `firstname-2026.png` — the filename becomes the profile label.
2. `node tools/extract.js` — reads them, writes the data and assembles
   `index.html`. Only changed screenshots are re-read.
3. Open `index.html`.

Step 1 is optional: with no screenshot, and with no `politi-results/` at all,
the build still writes a working page with an empty profile list — you can then
drop a capture onto it or type a profile in by hand.

You can also drop a screenshot onto the page itself, or type a profile in by
hand. `node tools/verify.js` checks extraction against values read by eye,
stored in `politi-results/fixture.json` (not committed).

## Layout

Three files are shared between Node and the browser, inlined into `index.html`
by the build so the page needs no module loading and no build step of its own:

- `tools/politi-dissect.js` — reads a PolitiScales result out of a screenshot.
- `tools/politi-model.js` — the axes and their weights, the party references,
  and every computation that turns a profile into a position. It touches no
  DOM, holds no state, and returns keys rather than sentences, so the wording
  stays in the locale table in `template.html`.
- `tools/politi-quiz.js` — the questionnaire: its items with their sources, the
  answer scales they were fielded with, the fixed order they are asked in, and
  the scoring from answers to readings.

Being requirable from Node is the point of the second one: the weights, the
proximity thresholds and the claims made about them have all been measured,
and a measurement nobody else can re-run is only an assertion.
`node tools/weight-sensitivity.js` re-runs one of them — it reports how often
a profile's nearest reference changes under other axis weightings, and shows
that what makes an attachment fragile is a tight margin to the runner-up, not
the weighting. It reads no profile; it exercises the model over its own input
space. `--country de` and `--profiles N` change what it runs on.

`node tools/model-check.js` asks the questions synthetic profiles cannot answer,
on the profiles you actually extracted: whether the "Souv." and "Écolo."
readouts repeat an axis, how coherently the social components are answered,
and how many attachments are toss-ups in each country. Every correlation comes
with its 95% interval and the verdict is read off the interval, so a small group
gets "too few profiles to conclude" rather than a number that looks like a
finding. It reads `profiles-data.js` and writes nothing.

## The questionnaire

No item is written for Politiskel. Each is quoted from a field-tested survey —
the European Social Survey, the International Social Survey Programme, the
European Values Study — in its official French questionnaire, and carries its
source down to the variable. The one set that has no French version, Erik Olin
Wright's class scale, is translated and flagged as such on every item.

The economy theme asks 32 items and feeds five readings:

| Reading | Items | Compared to parties |
| --- | --- | --- |
| x — economic left/right | 18, over CHES's three economic sub-scales | yes, `lrecon` |
| protectionism | 2 | yes, `protectionism` |
| class (Wright's anticapitalism scale) | 5 | no |
| perceived class conflict | 4 | no |
| capital / labour balance | 3 | no |

x is the plain mean of redistribution, public services vs taxes and
deregulation: across the 279 parties of CHES 2024 their mean reproduces
`lrecon` at r = 0.96, so a weighting would have nothing to recover.
Protectionism runs against `lrecon` there (r = −0.37) and is kept out of x.
Wright's scale is reported only complete, since a partial sum of an additive
scale is not the scale.

A questionnaire axis replaces the PolitiScales one wholesale — never averaged
with it — and the page names each coordinate's source. When it replaces one,
the compass draws the journey from the PolitiScales position.

Items are asked mixed, in one fixed order for everyone: a sort on a hash of
each item's id, so adding an item moves no other. An item whose wording leans
on the one before it travels with it. How much the theme matters is asked
before the items and again after, on four labelled points.

Answers stay in the browser, so `tools/model-check.js`, which reads
`profiles-data.js`, cannot test the questionnaire's readings yet.

## Readings of the compass

A picker redraws the compass along other axes, placing profiles and parties on
the same variables: the default (questionnaire x where answered, PolitiScales
y), PolitiScales alone, and economy × protectionism. A profile with no value on
an axis keeps its table row and is left off the chart. A populist reading
(people vs elites) will come with the institutions theme, named for the theory
it adopts.

CHES protectionism is used for France, Germany and the UK. Italy's nine party
means are all whole numbers, where the others rest on five to eleven experts —
consistent with a single rater — so it is left out, and the page says so.

## How it reads a screenshot

Percentages come from **bar geometry**, not text: a 5% segment carries no label
at all and would be invisible to OCR. The check is on the neutral share — the
derived value must match the gap measured between the two coloured segments.
Mottos do go through `tesseract`, snapped to a known vocabulary.

## Party positions

A profile means nothing in the absolute — it reads against the forces it could
actually vote for, and those change at every border. The reference parties are
therefore grouped by country, picked from a dropdown above the chart:

| Country | References | Source |
| --- | --- | --- |
| France | 15 | CHES 2024, plus 5 hand estimates |
| Germany | 9 | CHES 2024 |
| Italy | 10 | CHES 2024 |
| United Kingdom | 7 | CHES 2024 |
| United States | 6 | hand estimates only |

Most positions come from the **Chapel Hill Expert Survey 2024**, whose `lrecon`
and `galtan` scales are exactly the two axes used here: position =
(score − 5) × 20. Each reference carries where it comes from, and the page
counts its own sources rather than stating a figure that can go stale.

The hand estimates are flagged as such in the interface. They indicate an order
of magnitude, not a measurement.

What does not transpose across borders is the meaning of *a party*. CHES rates
parties, so in a multi-party system each reference is one. No expert survey on
these scales covers the **United States** — CHES-USA is announced, unpublished —
and two parties that each span half the board would place nobody, so that table
rates the main tendencies as well and says so on the page. Comparing a profile
to "the Democratic Party" and to "its progressive wing" are two different
questions, and only the second is informative there.

The proximity thresholds follow the same rule: they are derived from the
spacing of the references themselves, so they are recomputed whenever the
country changes. A crowded board earns tighter thresholds than a sparse one.

## Licence

MIT.
