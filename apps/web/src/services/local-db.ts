import type { Bookmark } from './bookmarks.ts'
import type { HistoryEntry } from './history.ts'

const DB_NAME = 'nearcrawl'
const DB_VERSION = 1

export const STORES = {
  bookmarks: 'bookmarks',
  history: 'history',
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      for (const storeName of Object.values(STORES)) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB failed to open'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
  })
}

async function put<T>(storeName: StoreName, value: T): Promise<void> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(storeName, 'readwrite')
    await requestToPromise(transaction.objectStore(storeName).put(value))
    await transactionDone(transaction)
  } finally {
    database.close()
  }
}

async function list<T>(storeName: StoreName): Promise<T[]> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(storeName, 'readonly')
    const records = await requestToPromise(
      transaction.objectStore(storeName).getAll() as IDBRequest<T[]>,
    )
    await transactionDone(transaction)
    return records
  } finally {
    database.close()
  }
}

export function saveBookmark(bookmark: Bookmark): Promise<void> {
  return put(STORES.bookmarks, bookmark)
}

export function listBookmarks(): Promise<Bookmark[]> {
  return list(STORES.bookmarks)
}

export function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  return put(STORES.history, entry)
}

export function listHistory(): Promise<HistoryEntry[]> {
  return list(STORES.history)
}
