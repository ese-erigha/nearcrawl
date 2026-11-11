# Home page, before sign-up

The visit does not require an account. The page reads the device location and loads what is hot in that country. The globe fills the screen and revolves. Sign up stays in the corner.

The layout follows [Global Hack Map](https://globalhackmap.vercel.app/) and its design notes in [yorkeccak/globalhackmap](https://github.com/yorkeccak/globalhackmap). The map stays live. The top bar keeps Daily brief, the GitHub mark, and the account button. The news on the screen is NearCrawl news.

## What the reference does

The live site is one dark screen. The map is the page. Panels sit on top of it.

- The top left holds the mark and the name. The credit sits on that same line, in small type: "built on Valyu". A moving ticker of new items sits in the middle. The right side is a pill of destinations. Map is the current destination. Daily brief is the next one. A GitHub mark sits in that pill. Sign in is a white button. The map still loads when that button is closed.
- The left panel is glass. It has one title, one live line, a time switch, one large count, a small bar chart, status chips that also filter the map, a search field, four tabs, and a scrolling list.
- The map is a dark dotted earth. It spins on its own while nobody touches it. A press, a drag, or a scroll stops the spin. The spin starts again 4 seconds after the pointer lifts, or 4 seconds after the last scroll. It continues from the place where it stopped. It does not jump back to a home country. A pin is a small source mark plus a title. Red marks the urgent items. A Layers control sits at the top right of the map.
- A dock along the bottom holds a horizontal row of urgent cards. The row can scroll.

Daily brief is a separate page at `/brief`. The same top bar stays. The page is a document: a large title, a count card, a dotted map, and the country list.

The design notes in that repo say the globe carries the drama and the panels stay quiet. One large number per view. Labels are small. Status color means status only.

## What this home keeps

- A full-screen globe, with glass panels on top of it.
- The name at the top left, with the Geoapify credit on that same line.
- Map as the current destination in the top pill.
- Daily brief as the other destination.
- A GitHub mark in that pill. It opens the NearCrawl source repository.
- A Sign up button. The visit works when the visitor never presses it.
- One left panel with one large count and a scrolling list.
- Pins on the globe, each with a source mark and a title.
- A bottom row of the urgent stories.

## What this home leaves out

- Am I affected, Agents, Pricing, and the Valyu mark. Those belong to the reference product.
- The 30 day switch. The feed window is 14 days, so the switch is 24h, 7d, and 14d.
- Confirmed, reported, and claimed. A NearCrawl story is breaking, or it is also hot.
- A Layers control. The home has one layer, the story pins.
- Mapbox. The globe is ours.
- A "Back to my region" button. The spin starts again where the drag stopped. The reference globe has no fly-home control.

## What the visitor gets

1. The page reads the device location.
2. `GET /api/articles?country=` loads the hot list for that country. A story stays when its pin is inside the country border. Breaking stories come first, then stories with more shares, then newer stories. `windowHours=48` is the brief window. The default window is the 14-day feed.
3. The globe opens on that country and revolves. A drag pauses it. The spin starts again 4 seconds after the drag ends, from that same place. The first pins come from `GET /api/spatial/news` for the whole world. A drag loads the box in view from the same route.
4. The left list is that hot list. Every visitor in the country sees the same list and the same order. A drag does not replace this list. After sign-up, this list follows the home countries, the topics, and the tracked names.
5. The search field filters the loaded hot list. It does not call the inference search.
6. Daily brief opens the public brief for that country. It calls `GET /api/articles?country=&windowHours=48`. It does not require an account. When the device location fails, the brief uses `GET /api/articles/breaking`. `/brief/user` calls the same country route for each saved country, and `GET /api/articles/mentions?q=` for each tracked name.
7. Sign up is visible. It does not block the globe, the list, the search, or the brief.

## Credit

Geoapify's free plan requires a link, and it names the words. The line reads "Powered by Geoapify". The link target is `https://www.geoapify.com/`. The same line carries "© OpenStreetMap contributors". That link target is `https://www.openstreetmap.org/copyright`. Geoapify's terms require the OpenStreetMap credit whenever the service is used. Use that phrase. The free plan names it.

The credit sits at the top left, on the same line as the name, in the slot the reference uses for "built on Valyu".

## Spin

A pin on the live reference globe moved while the page sat still. The globe code in that repo starts the spin again 4 seconds after a drag or a scroll. The spin is about 2.2 degrees a second. It keeps the longitude where the drag stopped. A close zoom stops the spin until the view is wide again. A request for reduced motion stops the spin.

The NearCrawl globe uses that same rule. The first frame faces the device country. The hot list on the left stays that country. Pins ride the earth, so they travel as the globe turns. A drag loads the box in view once, from `GET /api/spatial/news`. The spin does not send a new query on every frame.

## Three jobs

Each strip answers a different question.

- The ticker is the wire. It carries the newest breaking title in the world, one title at a time. The next title rolls in and the previous title rolls out. A click opens that story. The ticker stays the world wire after sign-up. It does not switch to the preference list.
- The left panel is yours. Before sign-up it is the hot list for the device country. That list includes breaking stories and the other hot stories. After sign-up it follows the home countries, the topics, and the tracked names.
- The bottom dock is global breaking news. The label is "Global Breaking News". The cards sit in that one frame.

A title can slide through the ticker and also sit in a list. The ticker is one line in the bar.

## Home

```text
+--------------------------------------------------------------------------------+
| (o) NearCrawl   Powered by Geoapify   © OpenStreetMap                          |
|                                                                                |
|   [ LIVE  Newest breaking title rolls in ]  ( Map ) Daily brief GH [ Sign up ] |
| +----------------------------+                                                 |
| | Hot in [country]      [x]  |              revolving                          |
| | Hot where you are.         |                 .---.                           |
| | * Live · 14-day feed       |              .-'     `-.                        |
| |              24h 7d (14d)  |             /    pin    \                       |
| | STORIES        LAST 14 DAYS|            |      *      |                      |
| | 12            | bar chart | |             \          /                        |
| | * Breaking 4  o Also hot 8 |              `-.     .-'                        |
| | [ Search this region ]     |                 `---'                           |
| | Daily brief                |                                                 |
| | ( All 12 ) Politics 3 ...  |                                                 |
| | BREAKING                   |                                                 |
| | KY  Title             2h   |                                                 |
| |     Breaking · one line    |  +-------------------------------------------+  |
| | ALSO HOT                   |  | Global Breaking News                   < >|  |
| |                            |  | +-----------+ +-----------+ +-----------+ |  |
| |                            |  | | src  · 2h | | src  · 6h | | src  · 1d | |  |
| |                            |  | | Title     | | Title     | | Title     | |  |
| |                            |  | | One line  | | One line  | | One line  | |  |
| |                            |  | +-----------+ +-----------+ +-----------+ |  |
| |                            |  +-------------------------------------------+  |
| +----------------------------+                                                 |
+--------------------------------------------------------------------------------+
```

`[x]` closes the left panel. The globe stays. A small button opens the panel again.

The left panel runs from under the top bar to the bottom of the page. The breaking-news dock sits in the globe column, beside the panel. It does not run under the panel.

A breaking row paints the word Breaking in the breaking color. The dock label is "Global Breaking News". It sits on the left of that frame, the way "PATCH NOW" sits on the reference. The cards sit in the same frame. `<` and `>` scroll the cards inside the frame.

## Daily brief

The brief page is a document. The globe is gone. The same top bar stays, and Daily brief is the current destination.

The list is the device country from `GET /api/briefs?country=`. The server applies the 48-hour window, then summarizes those stories. Breaking stories are the first group. Also hot stories are the second group. When the device location fails, the list is the breaking feed, cut to 48 hours, and the summary stays empty.

`/brief/user` is the same document for a visitor who saved preferences. The sample set is the United States, the United Kingdom, Nigeria, and Germany, plus Finance and Disaster. A tracked name can pull one more story. The device-country storm stays on `/brief`.

The page reads top to bottom:

- A breadcrumb: Live map, then Daily brief.
- A date line, then one large title: what is hot in that country in the last 48 hours.
- One byline. It reads: researched by NearCrawl from the source count, then the time. Counts are live.
- One opening paragraph. It is the model summary of the stories in the list. When the model is down, the paragraph stays empty.
- Three actions: Open the live map, Copy as a thread, and Read the full report. The report link moves to the list on this page.
- A count card. The large number is the story count. Breaking, also hot, and sources split it. Politics, finance, disaster, and shares sit under that split.
- A dotted world map. Pins mark the stories in the list. A breaking pin is solid red. An also-hot pin is hollow.
- Numbered rows. Each row has a title, the article body, the source name, and the source host.
- A side rail. Copy link and Open the live map sit in the morning card. Copy link, Post, LinkedIn, and More sit in the share card.

There is no Slack bot and no RSS feed. Those belong to the reference product. A story row has no "What to do" box.

```text
+--------------------------------------------------------------------------------+
| (o) NearCrawl   Powered by Geoapify   © OpenStreetMap                          |
| [ LIVE  Title rolls in ]     Map   ( Daily brief )   GH   [ Sign up ]          |
+--------------------------------------------------------------------------------+
| Live map  >  Daily brief                                                       |
|                                                                                |
| DAILY BRIEF  ·  SUNDAY 8 NOVEMBER          +------------------------------+    |
|                                            | STORIES      LAST 48 HOURS   |    |
| What is hot in Japan                       |  5                           |    |
| in the last 48 hours                       |  in 1 country                |    |
|                                            | Breaking | Also hot | Sources|    |
| Researched by NearCrawl. Counts are live. |    2     |    3     |   5    |    |
|                                            | Politics                  2  |    |
| The last 48 hours in Japan turn on 5 ...   | Finance                   1  |    |
|                                            | Disaster                  2  |    |
| [ Open the live map ] [ Copy as a thread ] | Shares                   95  |    |
| Read the full report                       +------------------------------+    |
|                                                                                |
| +------------------------------------------------------------------------+     |
| |  dotted world map                         red pins, hollow pins        |     |
| +------------------------------------------------------------------------+     |
| WHERE THE STORIES ARE                                                          |
|                                                                                |
| BREAKING                              2          GET THIS EVERY MORNING        |
| 01  Title                                          [ Copy link ]               |
|     The article body, a short paragraph.           [ Open the live map ]       |
|     Kyodo   english.kyodonews.net                  SHARE TODAY'S BRIEF         |
|                                                    [ Copy link ] [ Post ]      |
|                                                    [ LinkedIn ]  [ More ]      |
| ALSO HOT                              3                                        |
+--------------------------------------------------------------------------------+
```

## Regions

- **Ticker.** The newest breaking title in the world, one at a time. The line rolls. A click opens that story. Sign-up does not change this wire.
- **Map.** The current screen is the home above. The pill shows Map as current.
- **Daily brief.** Opens the document above. The brief is the hot list for the device country. Breaking stories come first. The other hot stories follow.
- **GitHub.** The mark in the pill. It opens the NearCrawl repository in a new tab.
- **Sign up.** A white button. The home does not wait for it. The account form is a later screen.
- **Left panel.** Before sign-up, the country comes from the device location and the list is the hot list for that country. After sign-up, the list follows the home countries, the topics, and the tracked names. The large number is the size of that list. A category chip filters it. The search field filters that loaded list.
- **Name and credit.** Top left. "Powered by Geoapify" links to Geoapify. "© OpenStreetMap contributors" links to the OpenStreetMap copyright page.
- **Globe.** It revolves until a press, a drag, or a scroll. The spin starts again 4 seconds later, from the place where it stopped. The first frame faces the device country. A breaking pin uses one urgent color. Other pins stay neutral.
- **Bottom dock.** One frame in the globe column. The left panel continues beside it to the bottom of the page. The label is "Global Breaking News". The cards sit in that frame. Arrows scroll the cards inside it.

## Color and type

Follow the reference, with NearCrawl words.

- The page background is near black. Panels are dark glass. Text is off-white. Secondary text is gray.
- One color means breaking. Also hot uses a hollow mark. Topic words stay gray.
- One large number in the left panel. The label says stories. A bar chart sits beside it. Breaking and also hot split that number.
- Body text stays small. The country name and the brief title are the only large titles.
