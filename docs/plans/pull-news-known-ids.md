# Stop a pull on a known page

A later pull starts at page 1 and stops when every `apitube_id` on the page is already in `articles`. The pull still writes that page. It does not request the next page.

This change adds no column and no index. It does not edit the pull cron.

## What APITube confirms

The client sends `sort.by=published_at` and `sort.order=desc`. APITube's filter page says both of those are the defaults. `sort.order=asc` on `published_at` is oldest first. `desc` is the other direction, so page 1 holds the latest publication times in the filtered window.

The same page lists `new` and `created_at` as other sort fields. The docs read for this plan do not define those two fields. This plan keeps `published_at`.

A newly indexed article keeps its own `published_at`. When that time is older than the articles on page 1, the article is on a later page. The stop rule does not request that page. A later full walk can collect it. This plan does not add that walk.

Source: [APITube filters, Sorting](https://docs.apitube.io/platform/news-api/filters) and [sorting examples](https://docs.apitube.io/platform/news-api/common-workflows/examples/sorting-examples). Checked 31 Oct 2026.

## Schema

`articles.apitube_id` is `NOT NULL UNIQUE` in `infra/migrations/0000_create_articles.sql`. Postgres keeps a unique index for that constraint. A lookup of the ids on one page uses that index.

- Add no column.
- Add no index.
- Add no migration file.

## Read

Add `listExistingApitubeIds` on `DbArticleRepository`. The input is the `apitube_id` values from one page. The result is the subset already stored.

The SQL is one `SELECT apitube_id FROM articles WHERE apitube_id IN (...)`. An empty input skips the query and returns an empty list.

Call this read before the page write. A write inserts the new ids, so a check after the write makes every page look known and the pull stops on page 1.

## Pull

`pullNews` still starts at page 1. `published_at.start` stays at now minus `FEED_RETENTION_DAYS`. `language.code` stays `en`.

After the existing-id read, and after the page write:

1. An empty page ends the pull.
2. A page with no next page ends the pull.
3. A page whose items are all older than the feed window ends the pull.
4. A page that has ids, and whose every id was already stored before the write, ends the pull.
5. Any other page requests the next page.

A page of dropped items has no id. Rule 4 does not apply to that page. The empty, next-page, and age rules still apply.

The page write stays one batch. Known ids on a fetched page are still updated. The saved cost is the APITube pages that the pull does not request.

## Tests

- When every id on the page was already stored, then the pull does not request the next page.
- When one id on the page is absent, then the pull requests the next page.
- When the id list is empty, then `listExistingApitubeIds` does not query.

## Out of this change

- The pull cron is off. This change does not edit it.
- No daily full walk. That walk is the current loop, run on its own schedule, for late-indexed articles and edits past the known page.
- No change to `published_at.start`.
