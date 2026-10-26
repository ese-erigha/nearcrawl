export type GeoPoint = {
  latitude: number
  longitude: number
}

export type Bookmark = {
  id: string
  title: string
  summary: string
  sourceUrl: string
  coordinates: GeoPoint
  tags: string[]
  savedAt: string
}

export type BookmarkDraft = Omit<Bookmark, 'id' | 'savedAt'>

export function createBookmark(draft: BookmarkDraft, now = new Date()): Bookmark {
  return {
    ...draft,
    id: crypto.randomUUID(),
    savedAt: now.toISOString(),
  }
}
