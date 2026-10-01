# Politiskel

Discover your political skeleton.

Politiskel places political profiles on several readings of the political
space — economic left/right against CHES's cultural GAL-TAN axis by default —
compares them against the parties of a chosen country, and breaks each profile
down axis by axis, so a group can see where it actually diverges rather than
only where its average sits.

A profile comes from a [PolitiScales](https://politiscales.fr) result, from
Politiskel's own questionnaire, or from both: the questionnaire can complete a
PolitiScales profile, or start one from nothing.

## Direction

- **A native test is the goal.** Answering inside Politiskel, no detour and no
  import. The economy and society themes exist, and replace both compass axes;
  Europe and the world, ecology and institutions are planned, each with its
  counterpart in CHES so its readings stay comparable to the parties.
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

The repository holds code, never profiles. Everything derived from answers
stays out of git — see `.gitignore`. On a running site, a member's answers
and PolitiScales percentages are stored on its server and shown to the
members of their groups only; a PolitiScales screenshot is read in the
browser and never leaves it. Without an account, `/essai` keeps a trial
profile in the browser alone, and signing up carries it over.

## Layout

| Path | What it holds |
| --- | --- |
| `site/` | the site: SvelteKit, one page per address, built to static files |
| `server/` | the Rust service (axum, SQLite): accounts, groups, the API, and it serves `site/build` |
| `tools/` | the model shared by the site and the measuring tools, and those tools |

In `site/src/`, `routes/` holds the pages, `lib/components/` their parts,
`lib/i18n/fr.js` every sentence the site shows, `lib/flag/` the Politiskel
flag (its symbols, CC BY 3.0, and how readings choose colours, layout and
symbols), and `tokens.css` the palettes, type and motion.

Three files are shared between Node and the browser; the site imports them
as they are:

- `tools/politi-dissect.js` — reads a PolitiScales result out of a screenshot.
- `tools/politi-model.js` — the axes and their weights, the party references,
  and every computation that turns a profile into a position. It touches no
  DOM, holds no state, and returns keys rather than sentences, so the wording
  stays in the site's locale table.
- `tools/politi-quiz.js` — the questionnaire: its items with their sources, the
  answer scales they were fielded with, the fixed order they are asked in, and
  the scoring from answers to readings.

## Running it

```
cd site && npm install && npm run build      # → site/build
cd ../server && cargo build --release
POLITISKEL_DB=politiskel.db POLITISKEL_SITE=../site/build POLITISKEL_INSECURE_COOKIES=1 \
  ./target/release/politiskel-server          # http://127.0.0.1:8080
```

While working on the site, `npm run dev` in `site/` serves it on
http://localhost:5173 and passes `/api` to a server on port 8080.

## Measuring the model

Being requirable from Node is the point of the model: the weights, the
proximity thresholds and the claims made about them have all been measured,
and a measurement nobody else can re-run is only an assertion.
`node tools/weight-sensitivity.js` re-runs one of them — it reports how often
a profile's nearest reference changes under other axis weightings, and shows
that what makes an attachment fragile is a tight margin to the runner-up, not
the weighting. It reads no profile; it exercises the model over its own input
space. `--country de` and `--profiles N` change what it runs on.

`node tools/model-check.js` asks the questions synthetic profiles cannot answer,
on real profiles: whether the "Écolo." readout repeats an axis, how coherently
the social components are answered, and how many attachments are toss-ups in
each country. Every correlation comes with its 95% interval and the verdict is
read off the interval, so a small group gets "too few profiles to conclude"
rather than a number that looks like a finding. It reads `profiles-data.js`,
which `node tools/extract.js` writes from PolitiScales screenshots dropped in
`politi-results/` (named `firstname-2026.png`) and from answer files in
`politi-results/answers/` — the account export of the site, "Exporter toutes
mes données", is one. Neither is committed. `node tools/verify.js` checks the
screenshot reading against values read by eye, in
`politi-results/fixture.json`.

With answers it also checks the questionnaire: whether protectionism and the
three class readings repeat x, how far the questionnaire moves each axis from
PolitiScales for the same people, whether each sub-dimension goes with the
rest of its axis — does religion part from y? — and which items, if any, run
against their own axis. Synthetic answers cannot stand in for these: whoever
generates them picks how coherent they are, and with it the answer.

## The questionnaire

No item is written for Politiskel. Each is quoted from a field-tested survey —
the European Social Survey, the International Social Survey Programme, the
European Values Study — in its official French questionnaire, and carries its
source down to the variable. The one set that has no French version, Erik Olin
Wright's class scale, is translated and flagged as such on every item. Only
the instruction above an item is adapted: a survey writes it for a grid asked
in a row ("each of the following statements"), and here each screen asks one
item in a mixed order, so the screen shows it in the singular. The official
stem stays in the item bank as its provenance, and `tools/extract.js` flags an
instruction that still speaks of a list.

The economy theme asks 32 items and feeds five readings; the society theme
asks 40 and feeds y.

| Reading | Items | Compared to parties |
| --- | --- | --- |
| x — economic left/right | 18, over CHES's three economic sub-scales | yes, `lrecon` |
| protectionism | 2 | yes, `protectionism` |
| class (Wright's anticapitalism scale) | 5 | no |
| perceived class conflict | 4 | no |
| capital / labour balance | 3 | no |
| y — GAL-TAN (cultural) | 40, over CHES's seven society sub-scales | yes, `galtan` |

x is the plain mean of redistribution, public services vs taxes and
deregulation: across the 279 parties of CHES 2024 their mean reproduces
`lrecon` at r = 0.96, so a weighting would have nothing to recover.
Protectionism runs against `lrecon` there (r = −0.37) and is kept out of x.
y is built the same way from immigration, multiculturalism, civil liberties
vs law and order, women's rights, LGBT rights, religion in politics and
nationalism, whose mean reproduces `galtan` at r = 0.97; dropping any one
leaves 0.96. The society bank also holds 20 verified items that are not
asked (`reserve`), each with the reason, so a thin sub-dimension can be
widened without sourcing again.
Wright's scale is reported only complete, since a partial sum of an additive
scale is not the scale.

A questionnaire axis replaces the PolitiScales one wholesale — never averaged
with it — and the page names each coordinate's source. When it replaces one,
the compass draws the journey from the PolitiScales position.

Items are asked mixed, in one fixed order for everyone: a sort on a hash of
each item's id, so adding an item moves no other. An item whose wording leans
on the one before it travels with it. How much the theme matters is asked
before the items and again after, on four labelled points.

Answers are saved to the member's account as they are given; exported, they
let `tools/model-check.js` test the questionnaire on them (see above).

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

## Hosting it for a group

`server/` serves the built site and its API: each member signs up under a
pseudonym, gets one profile, and sees the profiles of the groups they have
joined through an invitation link.

It listens on localhost only: put a reverse proxy that terminates HTTPS in
front of it (Caddy: `politiskel.example.org { reverse_proxy 127.0.0.1:8080 }`).
Behind it, set `POLITISKEL_TRUST_PROXY=1`, so that login limits count per
client address (the last `X-Forwarded-For` entry, the one the proxy adds)
rather than treating every visitor as the proxy. If the proxy rewrites the
Host header — nginx does unless told `proxy_set_header Host $host;` — also
set `POLITISKEL_ORIGIN=https://your.host`, or every sign-in and save will be
refused as coming from another site. Session cookies are marked
Secure, so plain http only works for local development, with
`POLITISKEL_INSECURE_COOKIES=1`. The database is one SQLite
file: back it up like any other.

Each group has an owner — its creator, then its longest-standing member if
they leave — who can issue a new invitation link (the old one stops working),
remove a member, hand the group over or delete it. `POLITISKEL_SIGNUP=invite`
opens accounts only from an invitation link (the very first account, the
host's, is always allowed); either way an address may open five accounts an
hour. Members change their password, which ends their other sessions; there
is no e-mail, so a forgotten one is reset on the server with
`politiskel-server reset-password <name>`. `politiskel-server backup <file>`
copies the database while it runs. [`server/DEPLOY.md`](server/DEPLOY.md)
walks through a deployment — systemd, nginx or Caddy, daily backups, updates —
and `server/deploy/` holds the files it uses, with a privacy notice template.

What the server holds, and why it is careful about it: political opinions are
special-category data under GDPR art. 9. It stores a pseudonym, an argon2id
password hash, the date consent was given, group memberships, PolitiScales
percentages already read in the browser — never the screenshot — and
questionnaire answers. Sign-up requires explicit consent; a group is visible
to its members only, and an invitation link shows the group before anyone
joins it; each member can export everything held about them and
delete their account, which deletes it all. Whoever runs an instance is the
data controller for it.

`cargo test` runs the API end to end against an in-memory database.

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

MIT. Most flag symbols in `site/src/lib/flag/icons.js` come from
[game-icons.net](https://game-icons.net/), by Lorc, Delapouite, Skoll and
HeavenlyDog, under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/);
the site credits them under each flag, on its flags page and in its footer.
The others are drawn for Politiskel, by `tools/draw-flag-symbols.js`.
