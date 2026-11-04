# Phase 3 personalization

The page is already built. A visit does not require an account. This plan adds an optional account, a preference list, a pin order that follows reading, a copy of bookmarks and history, and a breaking-news push.

## What you see

### Before

You open the home page. You do not sign in. The page reads the device location and loads what is hot in that region. You move the globe and the pins in view change with the box you look at. Every visitor in that region sees the same hot list and the same pin order. A bookmark and a reading history stay on that device. A second phone starts empty. A breaking article appears only when you look at its place.

### After

The home page works the same way with no account. Location still opens the region. The hot list for that region still loads. Sign-in stays optional.

You can sign in with an email code. The page then asks for home countries, topics, and names you follow. The articles in view stay the same. Pins that match those choices sit higher.

You keep reading. A click, a long stay, or a skip is remembered. The next time you look at that region, the order moves toward what you opened and away from what you skipped. A new account has no reading history yet, so the countries, topics, and names carry the order until that history exists.

A bookmark or an open is saved on the device and copied to the account. You sign in on another device and those lists are there. An article can leave the feed and the bookmark still opens.

A breaking article lands in a home country or a topic you follow. The browser shows a notification. You tap it and the source opens. With no account, there is no notification and the pin order stays the shared order.

The product doc names four stories. The preference list covers a new account. The cloud copy keeps bookmarks and history after a second device signs in. LightGBM re-ranks the pins already returned for the view. A push fires when a breaking article matches a home country or a preferred topic.

The gateway stays the public API. The browser does not call Render and does not call Redis. `apps/inference` scores the candidates. A missing model does not blank the map. The hot list for the device location stays a public read.

## Leave these out

- A new globe, a new search box, and a new answer stream.
- A second Render service, a GPU, and a Render database.
- DeepEval and a call to APITube from the gateway or the page.
- Entity character offsets, `sentiment`, and `source.bias`.
- A retrain on the pin request.

## User stories

1. As a signed-in user, I want to set home countries, topics, and tracked names, so that the pins in view favor those interests.
2. As a signed-in user, I want bookmarks and history to copy to Neon, so that a second device can restore them.
3. As a signed-in user, I want the pins in view re-ranked from clicks, dwell, and skips, so that the map follows my reading.
4. As a signed-in user, I want a push when a breaking article hits a home country or a preferred topic, so that I do not have to watch the globe.

## Identity

`Variables.userId` is already optional. This plan fills it.

A session middleware reads the cookie `nc_session`. A valid cookie sets `userId`. A missing cookie leaves `userId` empty. News routes stay public.

- `POST /api/session-codes` accepts `{ "email" }`. The gateway stores a hashed code and sends that code to the email. The code lifetime is `LOGIN_CODE_MINUTES` in `apps/gateway/wrangler.toml`.
- `POST /api/sessions` accepts `{ "email", "code" }`. A match sets an HttpOnly cookie. The session lifetime is `SESSION_DAYS`.
- `DELETE /api/sessions` clears the cookie.

The mail sender is a Worker binding. Do not add a second mail vendor. The code and the session token are hashed at rest. The response never returns them.

`getUserId()` throws when a signed-in route has no user. The pin read does not throw. It ranks only when `userId` is set.

## Preferences

One row per user. The onboarding modal is already a page concern. This plan stores the result.

`PUT /api/preferences` accepts the three lists. `GET /api/preferences` returns them. An absent row is 404. The page treats 404 as "show the modal".

- `homeCountryCodes` uses the same country codes as `article_countries`. The cap is `HOME_REGION_CAP`.
- `categoryIds` must exist in `categories`. The cap is `TOPIC_CAP`.
- `trackedNames` are trimmed display names. The cap is `TRACKED_NAME_CAP`.

The home page still opens on the device location and still loads the hot list for that region. A preference does not move the camera and does not replace that list. This plan returns the country list for the rank and for the push.

## Bookmarks and history

IndexedDB remains the first write. A signed-in page also sends the snapshot.

`PUT /api/bookmarks` replaces that user's rows. `GET /api/bookmarks` returns them. `PUT /api/history` and `GET /api/history` do the same for opens.

A bookmark stores `articleId`, `title`, `description`, `sourceUrl`, `latitude`, `longitude`, `tags`, and `savedAt`. `articleId` is null when the feed has purged the article. The purge must not delete the snapshot. Use `ON DELETE SET NULL`.

A history row stores `articleId`, `title`, and `openedAt`. The same purge rule applies.

The page merges cloud rows into IndexedDB by `sourceUrl` for a bookmark and by `articleId` plus `openedAt` for a history row. The gateway does not read IndexedDB.

## Signals

The page posts a batch to `POST /api/signals`. Each item has `articleId`, `type`, and `at`. `type` is a closed set.

```text
click
dwell
skip
```

`dwell` also sends `elapsedMs`. The batch cap is `SIGNAL_BATCH_CAP`. A larger batch is 400.

The gateway writes the batch to Upstash Redis over HTTPS and returns 202. It does not insert into Neon on this request. The Worker secret names are `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

A Worker cron drains Redis into `user_signals`. The schedule is `SIGNAL_DRAIN_MINUTES`. The drain is the training copy. A Redis restart must not be the only copy for longer than one drain interval.

## Entities

Ingestion starts storing APITube entities. One row per article and entity id.

- `apitube_entity_id`
- `name`
- `entity_type`, limited to `person` and `organization`

The rank matches a tracked name to `name` with case-folded equality. Positions stay out. The article fields plan keeps them until a screen highlights a span.

## Rank

Stage 1 is the current bbox read. The cap stays `SPATIAL_NEWS_CAP`. Stage 2 reorders those ids.

When `userId` is set, `listSpatialNews` calls `POST /article-orders` on the inference service with `{ "userId", "articleIds" }`. The gateway sends the same bearer secret as the answer routes. The inference route returns `{ "articleIds" }` in rank order. The gateway loads no model.

A 503 or a timeout from Render returns the stage-1 order and sets `ranked` to false. The map stays up. The answer routes still map a dead Render to 503. This read is the exception.

The rank target is under 50 ms for one batch of `SPATIAL_NEWS_CAP` candidates. That budget is the score step. It does not include the Neon bbox read.

### Cold start

No model file means the score is a sum of explicit matches.

- The article category is a preferred topic.
- The article country is a home country.
- An entity name equals a tracked name.
- `is_breaking` is true.

Ties keep the stage-1 order.

### LightGBM

`apps/inference/src/ordering` holds the trainer and the scorer. The scorer loads `model.txt` at process start. A missing file uses the cold-start score.

The trainer reads `user_signals` and the article columns. It writes `model.txt`. A person runs the trainer. The pin request does not train.

Features for one candidate:

- topic match, home-country match, tracked-name match, and `is_breaking`
- `share_count`
- hours since `published_at`
- the user's click count, dwell total, and skip count for that category

Labels:

- A click is positive.
- A dwell at or above `DWELL_POSITIVE_MS` is positive.
- A skip is negative.

The first train waits until `user_signals` has at least `MIN_TRAIN_ROWS` rows. Until then the service keeps the cold-start score.

Add `lightgbm` to `apps/inference`. The Render start command does not change. The model file is part of the inference image after a train, not a database blob.

## Push

`PUT /api/push-subscriptions` stores the browser subscription for the signed-in user. `DELETE /api/push-subscriptions` removes it.

The page service worker already exists. This plan adds the push handler. The worker shows the article title and opens `sourceUrl` on a click.

After each ingestion pull, the gateway cron looks for new `is_breaking` rows inside `PUSH_LOOKBACK_MINUTES`. A row matches a user when its country is a home country or its category is a preferred topic. One user receives at most `PUSH_USER_CAP` messages per pull.

VAPID keys are Worker secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. The public key is also a `[vars]` value so the page can subscribe. Do not put the private key in `[vars]`.

## SQL

One handwritten file from `pnpm db:new personalization`. `drizzle-kit generate` stays unused. Update `packages/db` by hand after the SQL.

Tables:

- `users` with a unique email
- `login_codes` with a hashed code and an expiry
- `sessions` with a hashed token and an expiry
- `user_preferences` as one row per user
- `user_preference_countries`
- `user_preference_categories`
- `user_tracked_names`
- `user_bookmarks` with `ON DELETE SET NULL` on `article_id`
- `user_history` with the same article rule
- `user_signals`
- `article_entities`
- `push_subscriptions`

## Routes

The browser calls the gateway. Controllers parse with Zod and call one use case.

- `POST /api/session-codes`
- `POST /api/sessions`
- `DELETE /api/sessions`
- `GET /api/preferences`
- `PUT /api/preferences`
- `GET /api/bookmarks`
- `PUT /api/bookmarks`
- `GET /api/history`
- `PUT /api/history`
- `POST /api/signals`
- `PUT /api/push-subscriptions`
- `DELETE /api/push-subscriptions`

`GET /api/spatial/news` keeps its query string. A signed-in request adds the rank. The JSON gains `ranked`.

`POST /article-orders` is inference-only. It requires the bearer secret. It returns JSON, not an event stream.

Status codes stay the gateway set. A bad body is 400. A missing preference row is 404. A missing session on a signed-in route is 401. Redis or the mail sender down is 503.

## Tests

Use a fake Redis, a fake mail sender, and a fake ranker. Do not call Upstash, Neon, or Render from a test.

- When the code matches, then the session cookie is set.
- When the code is wrong, then the session route returns 401.
- When the preference lists exceed a cap, then the route returns 400.
- When the user has no preference row, then the read returns 404.
- When a bookmark is saved and the article is purged, then the snapshot remains with a null `articleId`.
- When the signal batch is inside the cap, then the gateway writes Redis and returns 202.
- When Render rank fails, then the pin order is unchanged and `ranked` is false.
- When no model file exists, then a preferred topic outranks an unmatched pin.
- When the model file exists, then the scorer returns the model order.
- When a breaking article matches a home country, then that user is a push recipient.
- When the user has no subscription, then the push step sends nothing.

## Setup

1. Add the SQL file and the Drizzle tables.
2. Add the session cookie, the preference routes, and the snapshot routes on the gateway.
3. Add the Upstash secrets and the signal drain cron.
4. Teach ingestion to write `article_entities`.
5. Add `POST /article-orders` and the cold-start scorer. Ship LightGBM behind a missing-model fallback.
6. Add the push subscription routes, the VAPID secrets, and the breaking-news send.
7. Point the built page at the new routes. The globe code stays as it is.
8. Push `develop`. Confirm the migrate job, then the gateway job.
9. Sign in, save a preference, and reload the globe. The pin response includes `ranked`.
