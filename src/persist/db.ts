// Minimal IndexedDB wrapper for chunk persistence
export interface ChunkRecord {
  key: string // "cx,cy"
  cx: number
  cy: number
  tiles: number[] // RLE encoded
  bg: number[] // RLE encoded
}

export interface MetaRecord {
  key: string // 'main'
  seed: number
  player: { x: number, y: number }
  tool?: 'none'|'axe'|'shovel'|'pickaxe'
  inventory: { selectedSlot: number, slots: { item: number|string|null, count: number }[] }
}

const DB_NAME = 'terraria-lite'
const DB_VERSION = 1

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function putChunks(recs: ChunkRecord[]): Promise<void> {
  if (recs.length === 0) return
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite')
    const store = tx.objectStore('chunks')
    recs.forEach(r => store.put(r))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllChunks(): Promise<ChunkRecord[]> {
  const db = await openDb()
  return await new Promise((resolve, reject) => {
    const tx = db.transaction('chunks', 'readonly')
    const store = tx.objectStore('chunks')
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result as ChunkRecord[])
    req.onerror = () => reject(req.error)
  })
}

export async function clearChunks(): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite')
    const store = tx.objectStore('chunks')
    const req = store.clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function putMeta(meta: MetaRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite')
    const store = tx.objectStore('meta')
    store.put(meta)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getMeta(): Promise<MetaRecord | undefined> {
  const db = await openDb()
  return await new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly')
    const store = tx.objectStore('meta')
    const req = store.get('main')
    req.onsuccess = () => resolve(req.result as MetaRecord | undefined)
    req.onerror = () => reject(req.error)
  })
}
