# Pull news

The pull writes one APITube page in one database statement. A rejected item stays off that write. The pull logs the item and fetches the next page.

## One page

The pull loads the category index once. Then it handles each page in this order.

1. Fetch the page from APITube.
2. Split the items in memory.
3. Resolve each unknown medtop, as in [Unknown topics](#unknown-topics). Then put an item with a valid coordinate and a pin on the write list.
4. Put an item with a missing or out-of-range coordinate on the failure list.
5. Write the write list in one statement. An empty write list skips the database call.
6. Warn for each failed item, as in [Warning logs](#warning-logs).
7. Fetch the next page when this page has a next page and is not entirely older than the feed window.

`resolveArticleCategories` returns a pin for every item.

- A known medtop id pins that menu root. The root with the smallest id wins.
- No match pins the loaded root whose `medtop_id` is null. In the seed that row is General.
- An unknown medtop id is resolved before the article write. A response that names a parent inserts that category, and the article uses the new chain. A response that names no parent warns once, and the pin is General when no known topic remains.

A missing parent throws while the index is built, before page 1. A parent cycle throws there too. Both mean the categories table is broken, so the pull stops.

An old item stays off the write list. It is not a failure. A page whose every item is older than the feed window ends the pull. An empty page ends the pull. Past `APITUBE_MAX_PAGES` the pull throws.

The Neon HTTP driver runs one SQL statement per request. The page write is one multi-row form of the current article upsert.

- `INSERT … ON CONFLICT (apitube_id) DO UPDATE` writes the article rows. `ingested_at` stays on a repeat.
- The statement deletes `article_categories` rows whose `category_id` is absent from the new set for that article.
- The statement inserts the new join rows with `ON CONFLICT DO NOTHING`.
- Dedupe the page on `apitube_id` before the statement. Keep the later copy. Two copies of the same id in one `INSERT` make Postgres reject the page.

## Unknown topics

The same pull inserts a missing category, then writes the article. The article uses the new category on that run. You do not add a SQL file for the new topic.

The article link is the lookup. The pull requests that category URL. The response supplies the name and the parent medtop. The news item supplies the medtop id only.

"Bank launches a coin" arrives with only `medtop:20009999`. That id is absent. Its parent on the IPTC tree is central bank, `medtop:20000350`, already id 204. Economy is 49. Finance is 6.

```text
"Bank launches a coin"
        |
        | only topic medtop:20009999
        v
index has no medtop:20009999
index has medtop:20000350 as id 204
        |
        v
GET the category URL for medtop:20009999
response: name, parent medtop:20000350
        |
        v
INSERT INTO categories (name, parent_id, medtop_id)
Postgres assigns the next id
        |
        v
index chain: new id -> 204 -> 49 -> 6
        |
        v
UPSERT the article
  articles.category_id = 6
  joins = new id, 204, 49, 6
```

1. The pull loads `categories` and builds the index.
2. `medtop:20009999` is absent. `medtop:20000350` is id 204.
3. The pull requests the category URL. The response names parent `medtop:20000350`.
4. The pull inserts one `categories` row under parent 204. Postgres assigns the id. `ON CONFLICT (medtop_id)` keeps a single row when the page repeats that id.
5. The pull adds that row to the index. The chain is the new id, 204, 49, and 6. The pin is Finance.
6. The pull upserts the article in the page write. `articles.category_id` is 6. The joins are the new id, 204, 49, and 6.

The category insert runs before the article statement. `article_categories.category_id` references `categories.id`, so the new row must exist first. The article write stays one statement for the page.

When the parent medtop is also absent, the pull requests that category, inserts the parent first, then inserts the child. The walk stops at the first medtop already in `categories`.

When the response names no parent medtop, the pull inserts nothing. It warns once, as in [Warning logs](#warning-logs). The article still writes. The pin is General when that id is the only topic. `unknownTopics` counts those ids.

A second article on the page with the same new id uses the row from step 4. The pull inserts that medtop once.

Ids 1 through 18 stay the menu roots. A new row takes the next identity id and keeps the parent from the response. The live gateway accepts a category id that exists in `categories`. `isCategoryId` today reads `categoryCatalog`. Change that check so a row in Neon passes. `categoryCatalog` stays the list when the gateway has no database.

## Warning logs

Both warnings call `logger.warn` from `@sentry/cloudflare`. Each warning is a Sentry Log. Neither warning calls `captureException`. Neither warning opens an Issue.

The SDK sends the log when `SENTRY_DSN` is set and `SENTRY_ENVIRONMENT` is `production`. An empty DSN leaves the SDK off. The pull still prints the same line with `console.warn`.

Leave the title, the body, the API key, and `DATABASE_URL` out of both lines.

- **Skipped article.** One warning per item on the failure list. The cause is a missing or out-of-range coordinate. The pull continues with the rest of the page.

  ```text
  console.warn(`article skipped, apitube id ${apitubeId}, medtop ids ${medtopIds}`)
  logger.warn('article skipped', { apitubeId, medtopIds })
  ```

- **Unknown medtop.** One warning per medtop id the pull cannot place. The category response names no parent. A second article with the same id does not warn again. The pull still writes the article.

  ```text
  console.warn(`unknown medtop ${medtopId}`)
  logger.warn('unknown medtop', { medtopId })
  ```

The pull summary stays `logger.info` through `logPullCounts`. That record includes `pulled`, `upserted`, `skipped`, and `unknownTopics`. `unknownTopics` counts medtop ids the pull could not place. A missing parent in the loaded table throws before page 1. That path is `logger.error`, and the Sentry wrapper opens one Issue.
