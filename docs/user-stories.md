# User stories

This file lists the user stories in the PRD and in the phase plans. A story is **implemented** when the route or the browser store exists in the repo. The page does not call those routes yet. `apps/web` draws a colored box and a bookmarks note. No story is complete for a visitor.

The ingestion pull cron is `*/20 * * * *` in `apps/ingestion/wrangler.toml`. The purge code exists. The purge cron is off.

## Home page

The home page answers three questions. Each piece owns one question.

- **Left list.** What is hot where I am.
  - The list is the country hot list for the device country. The window is 14 days. A duplicate stays out.
  - Breaking stories come first, then stories with more shares, then newer stories.
  - The daily brief is this same list on its own page. Breaking is the first group. The other hot stories follow.
  - After sign-up, this list follows the home countries, the topics, and the tracked names.
- **Ticker.** What just broke in the world.
  - The set is every breaking story, in every country.
  - The order is `published_at`, newest first. A new story with no shares still belongs here.
  - The header shows one title, then the next. The ticker stays on the map and on the daily brief.
  - After sign-up, the ticker stays the world wire.
- **Bottom dock.** Which world story should I open.
  - The set is those same breaking stories.
  - The order is `share_count`, then `published_at`. A new story with no shares stays off the dock. An older story with many shares stays.
  - The dock sits only on the map. A card shows the country, the title, and one sentence. A click opens that story and turns the globe to its place.
- **Globe.** What the 14-day feed holds.
  - The globe takes the 100 newest stories in the 14-day window. The order is `published_at`, newest first. A duplicate stays out.
  - The globe does not rank by `share_count`. The dock already does that. A new story with no shares still belongs on the globe.
  - A story does not have to be breaking, and it does not have to sit in the dock.
  - A breaking pin is red. Any other pin is neutral. A click on any pin opens that story and turns the globe to its place.
  - The left list, the ticker, and the dock stay on their own sets. The globe does not copy those filters.
  - When one country fills the 100, cap the count per country. Do not switch the globe to shares.

A story appears in the ticker and the dock only when it is both new and widely shared.

Later, `story_id` groups the dock. Several articles about one event become one card. The ticker still shows each new article.

The page still draws both strips from one breaking list. The split above is the rule.

## Phase 1

- **US-1.1 Globe, pins, and heatmaps**
  - Story: As a user, I want a responsive 3D globe with pins and activity heatmaps, so that I can see the full feed without a text query.
  - Source: PRD Epic 1. The home page section above states the globe rule.
  - Status: The fixture globe pins the sample feed, including stories that are not breaking. A click opens that story. The page does not call the gateway. The 100-story cap is the rule. The page does not apply it yet.
- **US-1.2 News for one place**
  - Story: As a user, I want to click a country, a region, or a city, or draw a box, so that I see news only for that place.
  - Source: PRD Epic 1. The phase 1 plan adds the box read and the live seal.
  - Status: Implemented on the gateway. `GET /api/spatial/news` reads a box. `POST /api/spatial/news/live` seals updates for that box. The page has no click and no draw.
- **US-1.3 Category filter**
  - Story: As a reader, I choose a category, then a subcategory, and the globe shows that branch. I can also open that branch and read the latest stories without moving the globe.
  - Source: PRD Epic 1 and [plans/news-categories.md](plans/news-categories.md).
  - Status: Implemented on the gateway. `GET /api/spatial/news` accepts `categoryId`. `GET /api/categories` lists the catalog. `GET /api/categories/:id/articles` lists that branch. The page has no category control.
- **Home hot list**
  - Story: As a visitor, I open the home page with no account. The page reads my location and shows what is hot in that region. Breaking stories come first.
  - Source: [plans/hot-news-by-country.md](plans/hot-news-by-country.md).
  - Status: Implemented on the gateway. `GET /api/articles?country=` returns that list. The page does not read a location and does not call the route.
- **Article page**
  - Story: As a reader, I open one article and read the title, the description, the body, the source, and the read time.
  - Source: [plans/article-reader-and-hot-news.md](plans/article-reader-and-hot-news.md).
  - Status: Implemented on the gateway. `GET /api/articles/:id` returns those fields. The page has no article view. The JSON omits `storyId`.
- **US-1.4 Bookmarks on this device**
  - Story: As a user, I want to bookmark an article or a brief, so that the copy stays in this browser after the feed drops the article.
  - Source: PRD Epic 1.
  - Status: Not implemented for a visitor. `apps/web/src/services/local-db.ts` can save a bookmark and a history row in IndexedDB. No screen calls it.
- **Live list while you watch**
  - Story: As a user, I want the open article and the pins in view to update while I watch, so that a new story appears without a reload.
  - Source: Phase 1 gateway plan.
  - Status: Implemented on the gateway. `POST /api/articles/:id/live` and `POST /api/spatial/news/live` return a sealed query. The page does not subscribe.

## Phase 2

- **Pin explanation**
  - Story: As a user, I want to click a news pin and read a short cited explanation, so that I understand the event from the articles already stored for it.
  - Source: [plans/phase-2-inference.md](plans/phase-2-inference.md). The PRD calls the related story US-2.1 and asks for a brief of a drawn box. That box brief is in Future improvements.
  - Status: Implemented as a route. `POST /api/articles/:id/explanation` streams the answer. The page has no pin to click.
- **US-2.3 Divergence view**
  - Story: As a user, I want a short cited comparison of how outlets in different countries cover one story.
  - Source: PRD Epic 2 and the phase 2 plan.
  - Status: Implemented as a route. `POST /api/stories/:storyId/comparison` streams the answer. The article JSON does not include `storyId`, so the page cannot open this from a pin yet.
- **US-2.2 Search**
  - Story: As a user, I want to type a place or a question, so that I get a cited answer without finding that place on the globe.
  - Source: PRD Epic 2 and the phase 2 plan.
  - Status: Implemented as a route. `POST /api/search` streams the answer. The page has no search box. The search page also owes a Geoapify line and an OpenStreetMap copyright line. Those lines are not on a page yet.

## Phase 3

- **US-3.1 Preferences**
  - Story: As a signed-in user, I want to set home countries, topics, and tracked names, so that the pins in view favor those interests.
  - Source: PRD Epic 3 and [plans/phase-3-personalization.md](plans/phase-3-personalization.md).
  - Status: Not implemented. Sign-in stays optional. The home hot list stays the visit with no account.
- **US-3.2 Bookmarks and history on a second device**
  - Story: As a signed-in user, I want bookmarks and history to copy to the account, so that a second device can restore them.
  - Source: PRD Epic 3 and the phase 3 plan.
  - Status: Not implemented.
- **US-3.3 Pin order from reading**
  - Story: As a signed-in user, I want the pins in view reordered from clicks, long stays, and skips, so that the map follows my reading.
  - Source: PRD Epic 3 and the phase 3 plan. The inference route in that plan is `POST /article-orders`.
  - Status: Not implemented. Until a model file exists, the plan uses the preference score. A new account has no reading history yet.
- **US-3.4 Breaking-news alert**
  - Story: As a signed-in user, I want an alert when a breaking article hits a home country or a preferred topic.
  - Source: PRD Epic 3 and the phase 3 plan. The PRD says "tracked regions". The phase 3 plan matches a home country or a preferred topic.
  - Status: Not implemented.

## Future improvements

These items are named in the PRD or in a plan, and no current story above owns them.

- Draw a box and receive a cited brief for that box. PRD US-2.1. The built explanation route covers one article, not a box.
- A "what is new" answer, and an explanation of the hot list. The phase 2 plan leaves both out.
- DeepEval and Ragas for the cited answers. The PRD milestone lists them. The eval folder does not exist.
- The Phase 1 page: Globe.gl, pins, heatmaps, the Cloudflare Pages deploy, the bookmark screen, the history screen, the offline shell, and Sentry in the browser.
- Geoapify attribution and the OpenStreetMap copyright line on the search page.
- `storyId` on the article JSON, so the divergence view can open from a pin.
- `source_rank` as a tie break on the hot list. The column is stored. The hot list does not use it.
- A daily full walk of APITube for articles that arrive after the known page.
- Turn the purge cron on. The pull cron is `*/20 * * * *`. The purge code is in the ingestion Worker.
- A historical read beyond the 14-day feed, taken from APITube on demand. The PRD describes it. No route calls it.
- `sentiment.overall` and `source.bias` on a later screen. The article fields plan holds them for the divergence view and a later rank.
- Entity character positions. Phase 3 stores a name match only. Positions wait for a screen that highlights a span.
