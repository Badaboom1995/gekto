import fs from 'fs'
import path from 'path'

const STORE_FILENAME = 'gekto-store.json'

interface StoreData {
  version: number
  createdAt: string
  updatedAt: string
  data: Record<string, unknown>
}

function getStorePath(): string {
  return path.join(process.cwd(), STORE_FILENAME)
}

function createEmptyStore(): StoreData {
  const now = new Date().toISOString()
  return {
    version: 1,
    createdAt: now,
    updatedAt: now,
    data: {},
  }
}

export function initStore(): void {
  const storePath = getStorePath()

  if (fs.existsSync(storePath)) {
    console.log(`[Store] Found existing store at ${storePath}`)
  } else {
    console.log(`[Store] Creating new store at ${storePath}`)
    const emptyStore = createEmptyStore()
    fs.writeFileSync(storePath, JSON.stringify(emptyStore, null, 2), 'utf8')
    console.log(`[Store] Store created successfully`)
  }
}

export function readStore(): StoreData {
  const storePath = getStorePath()

  if (!fs.existsSync(storePath)) {
    initStore()
  }

  const content = fs.readFileSync(storePath, 'utf8')
  return JSON.parse(content) as StoreData
}

export function writeStore(data: StoreData): void {
  const storePath = getStorePath()
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8')
}

export function getData<T = unknown>(key: string): T | undefined {
  const store = readStore()
  return store.data[key] as T | undefined
}

export function setData<T = unknown>(key: string, value: T): void {
  const store = readStore()
  store.data[key] = value
  writeStore(store)
}

export function deleteData(key: string): boolean {
  const store = readStore()
  if (key in store.data) {
    delete store.data[key]
    writeStore(store)
    return true
  }
  return false
}
