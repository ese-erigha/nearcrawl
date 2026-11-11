# Home country control

The home list holds at most 3 countries. The device country starts selected. The control is a search field. The list under the field adds a country, and the chips stay. The field stops at 3 countries. A change loads the whole set in one request: `GET /api/articles?country=CA,AR`. The sidebar keeps 20 stories. Each selected country gets an equal share of those 20. Spare slots go to the countries that still have stories. Breaking and Also hot filter that list.

One selected country turns the globe to face it. Two or more frame a box around the set. The ticker and the dock stay the worldwide breaking feed.

```text
+--------------------------------------------------------------------------------+
| (o) NearCrawl   Powered by Geoapify   © OpenStreetMap                          |
|                                                                                |
|   [ LIVE  Newest breaking title rolls in ]  ( Map ) Daily brief GH [ Sign up ] |
| +--------------------------------+                                             |
| | Hot in                    [x]  |                 revolving                   |
| | [ Canada x ] [ Japan x ]       |                    .---.                    |
| | [ Add a country            ]   |                 .-'     `-.                 |
| | The globe frames the set.      |                /    pin    \                |
| | * Live · 14-day feed           |               |      *      |               |
| |                24h  7d  (14d)  |                \          /                 |
| | STORIES          LAST 14 DAYS  |                 `-.     .-'                 |
| | 12              | bar chart |  |                    `---'                     |
| | * Breaking 4    o Also hot 8  |                                             |
| | [ Search this region ]         |                                             |
| | Daily brief                    |                                             |
| | ( All 12 ) Politics 3 ...      |                                             |
| | BREAKING                       |                                             |
| | KY  Title                 2h   |  +---------------------------------------+  |
| |     Breaking · one line        |  | Global Breaking News               < >|  |
| | ALSO HOT                       |  | +---------+ +---------+ +---------+ |  |
| |                                |  | | src · 2h| | src · 6h| | src · 1d| |  |
| |                                |  | | Title   | | Title   | | Title   | |  |
| |                                |  | | One line| | One line| | One line| |  |
| |                                |  | +---------+ +---------+ +---------+ |  |
| |                                |  +---------------------------------------+  |
| +--------------------------------+                                             |
+--------------------------------------------------------------------------------+
```

`[ Canada x ]` and `[ Japan x ]` are the selected countries. Canada is the device country on the first load. The search field adds a country. `[x]` on a chip removes that country. `[x]` at the top closes the left panel. The globe stays.

`(14d)` is the selected window. `( All 12 )` is the selected topic. `*` is a filled dot. `o` is a hollow dot. A press on Breaking or Also hot keeps that status inside the loaded list. A second press clears it.

One query reads the selected countries. The whole list stops at 20 stories. Two countries get 10 each. Three countries get 6 each, and the 2 spare slots follow the same order. A country with fewer stories than its share keeps what it has. The spare slots go to the other countries.

The live line in the top bar is worldwide breaking news. The dock label is "Global Breaking News". `<` and `>` scroll those cards. A country change does not reload the ticker or the dock.
