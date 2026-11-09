# Left panel

The left panel is the country list on the home map. It sits on the globe. This note records how that panel differs from the Global Hack Map sidebar, and the shape NearCrawl uses instead.

The reference is [globalhackmap.vercel.app](https://globalhackmap.vercel.app/). The sidebar content lives in that app's situation view. The shell that opens and resizes it is `src/components/hud/map-sidebar.tsx`.

## What the two panels do

Both panels answer one question before the visitor reads a row.

- Their panel asks what attackers are using, who it hits, and how to lock it down.
- Our panel asks what is hot where you are.

Their unit is an organisation and an incident. Our unit is a story in one country. The feed window is 14 days. Their window runs to 30 days.

## Differences

### Frame

- Their title is two lines of condensed type. Ours is one line, "Hot in Japan", because the country name is short.
- Their close control is a sidebar glyph. Ours is a small square with an X. The plan keeps the X.
- Their subtitle is one sentence about the job of the panel. Ours is "Hot where you are."
- Their panel can be dragged wider. Ours is a fixed 420px column. Resize stays out. The home plan does not ask for it.

### Live line

- Theirs says "Live", then how long ago the snapshot updated. A green dot sits in front.
- Ours said "SAMPLE · 14-DAY FEED". The word Sample is gone. The line now reads "Live · 14-day feed". The dot uses the live color, not the breaking color.

### Time switch

- Theirs is 24h, 7d, and 30d. The selected pill is a quiet fill.
- Ours had no switch. The feed does not keep 30 days, so the switch is 24h, 7d, and 14d. 14d is the default. The list, the number, and the bars all follow that window.

### The metric

- Theirs puts the number in a darker card. The label is "ORGANISATIONS TRACKED". A second label names the window. A bar chart sits to the right of the number. The caption repeats the count as "sourced incidents". The axis runs from an older mark to "last 24h".
- Ours had a bare number and the word "stories". No card. No chart.
- Ours now uses the same card. The label is "STORIES". The heading follows the switch: Last 24 hours, Last 7 days, or Last 14 days. The bars are one bucket each. 24h uses 8 bars. 7d uses 7 bars. 14d uses 14 bars. The newest story sits in the right-hand bar. An empty bucket stays a short stub. The caption is "N sourced stories".

### Status split

- Theirs splits the number into Confirmed, Reported, and Claimed. Red, amber, and a hollow dot. The three counts add up to the big number. A press filters the list. A line under the card explains that.
- A NearCrawl story is breaking, or it is also hot. It is not confirmed, reported, or claimed. Those three words stay out.
- The card splits the same number into Breaking and Also hot. Breaking uses a filled red dot. Also hot uses a hollow dot. A press filters the list. A second press clears the filter. The counts stay the window totals, so the visitor can see the set they are about to open.
- The sentence under the card says the number is every story in this country for that window, and that a status filters the list.

### Search and the extra actions

- Theirs has a search field with a magnifying glass and a clear control.
- Ours had a plain field. It now has the glass icon and a clear control.
- Theirs then offers "What do you run?", Today's brief, and a Tour. "What do you run?" and the Tour belong to their product. Ours keeps one of those jobs: a Daily brief link. The brief is the same country list.

### Topic tabs

- Theirs shows kind tabs with counts: CVEs, Breaches, Malware, Outages. The selected tab is an outline pill, not a solid white pill.
- Ours had All, Politics, Finance, and Disaster as solid uppercase chips, with no counts. All was a white pill.
- The tabs are now sentence case, with a count. The selected tab is an outline. The counts follow the window and the status filter, then the tab filters the list again. Search filters the title after that.

### Rows

- Theirs gives each row a two-letter source mark, a title, an id on the right, and one gray line. Only the severity word is in color. The line also holds the age and a short snippet.
- Ours had a title and one amber line for every row. Breaking, Politics, Finance, and Disaster all used the same amber.
- A row now starts with a two-letter source mark. The age sits on the right of the title. Breaking is the breaking red. A topic word on an also-hot row stays gray. The description follows on that same line.

### Footer

- Theirs ends with an open-source line and a sign-in hint. Sign-in already sits in our top bar. The panel does not repeat it.

## What stays out

- Confirmed, Reported, and Claimed.
- A 30 day window.
- "What do you run?" and the Tour.
- A draggable width.
- A second status color. Amber stays on the story panel for a non-breaking chip. The left list does not use it.

## Panel

```text
+------------------------------------------+
| Hot in [country]                    [x]  |
| Hot where you are.                       |
|                                          |
| * Live · 14-day feed      24h  7d  (14d) |
|                                          |
| +--------------------------------------+ |
| | STORIES                 LAST 14 DAYS | |
| |                                      | |
| | 12                    ||| bar |||||  | |
| | 12 sourced stories    14d ago · now  | |
| |                                      | |
| | * Breaking          o Also hot       | |
| |   4                   8              | |
| +--------------------------------------+ |
|                                          |
| The number is every story in this        |
| country for that window. A status        |
| filters the list.                        |
|                                          |
| [ Q  Search this region              ]   |
|                                          |
| Daily brief                              |
|                                          |
| ( All 12 )  Politics 3  Finance 4        |
| Disaster 5                               |
|                                          |
| BREAKING                                 |
| +--------------------------------------+ |
| | KY  Title of the story            2h | |
| |     Breaking · one short line        | |
| +--------------------------------------+ |
|                                          |
| ALSO HOT                                 |
| +--------------------------------------+ |
| | AS  Title of the story            6h | |
| |     Politics · one short line        | |
| +--------------------------------------+ |
+------------------------------------------+
```

`[x]` closes the panel. The globe stays. `(14d)` is the selected window. `( All 12 )` is the selected topic. `*` is a filled dot. `o` is a hollow dot. `KY` and `AS` are the first two letters of the source name.

## Color

The page background is near black. The panel is one step lighter. The metric card and each row are one step lighter again. A hairline is the only border.

- Page, `space`, `#050505`.
- Panel, `surface`, `#111111`.
- Metric card and row, `surface-2`, `#191919`.
- Hairline, `#303030`.
- Primary text, `ink`, `#f2f2f2`.
- Live line, `ink-2`, `#c7c7c7`.
- Subtitle and topic word, `ink-3`, `#a3a3a3`.
- Captions, ages, and empty bars, `ink-4`, `#8c8c8c`.
- Breaking dot, the word Breaking, and a breaking pin, `#ff4a3d`.
- Live dot, `#6ee7b7`. This mark means the feed is on. It is not a second status.
- Also hot dot, hollow, hairline `#a3a3a3`.
- Bars with stories, `ink-2`. Empty bars are a short `ink-4` stub.
- Selected window pill, white at 10% on black.
- Selected topic tab, white fill and black text. The count uses the same black.

## Type

- The country title uses condensed Hubot Sans, 32px, bold.
- The big count uses the same face, 48px.
- The status counts use it at 28px.
- Small labels use Martian Mono, 10px, uppercase, wide tracking.
- Body, search, and tabs use Mona Sans.

## Order of the filters

The filters stack. Each one narrows the list. The big number does not move when a status, a topic, or a search is on. It moves when the window changes.

1. The window keeps stories inside 24 hours, 7 days, or 14 days.
2. Breaking or Also hot keeps one status. A second press on the same status clears it.
3. A topic keeps All, Politics, Finance, or Disaster.
4. Search keeps titles that contain the text.
