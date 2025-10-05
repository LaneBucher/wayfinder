const DB_NAME = 'wayfinder';
const DB_VERSION = 1;
const STORES = { responses: 'responses', mutations: 'mutations' } as const;
type StoreName = typeof STORES[keyof typeof STORES];

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.responses)) db.createObjectStore(STORES.responses);
      if (!db.objectStoreNames.contains(STORES.mutations)) db.createObjectStore(STORES.mutations);
    };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}
export async function idbGet<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onerror = () => reject(req.error); req.onsuccess = () => resolve(req.result as T | undefined);
  });
}
export async function idbSet(store: StoreName, key: IDBValidKey, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(value, key);
    req.onerror = () => reject(req.error); req.onsuccess = () => resolve();
  });
}
export async function idbDel(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    req.onerror = () => reject(req.error); req.onsuccess = () => resolve();
  });
}
export async function idbAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onerror = () => reject(req.error); req.onsuccess = () => resolve((req.result as T[]) || []);
  });
}
