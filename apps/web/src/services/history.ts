export type HistoryEntry = {
  id: string
  articleId: string
  title: string
  openedAt: string
}

export function createHistoryEntry(
  article: { articleId: string; title: string },
  now = new Date(),
): HistoryEntry {
  return {
    id: crypto.randomUUID(),
    articleId: article.articleId,
    title: article.title,
    openedAt: now.toISOString(),
  }
}
