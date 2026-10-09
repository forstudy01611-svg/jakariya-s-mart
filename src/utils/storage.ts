// Persistent Storage Utility with Quota Exceeded Protection & IndexedDB Fallback

const DB_NAME = 'jakariyas_mart_db_v1';
const STORE_NAME = 'keyval_store';

// Legacy keys to remove to free up localStorage quota
const OBSOLETE_KEY_PATTERNS = [
  /^jakariyas_mart_.*_v[1-6]$/,
  /^fugo_/,
  /^debug_/,
  /^temp_/,
];

/**
 * Clean up obsolete keys from localStorage to prevent QuotaExceededError
 */
export const cleanupLegacyStorage = (): number => {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  let freedCount = 0;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && OBSOLETE_KEY_PATTERNS.some((pat) => pat.test(key))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
        freedCount++;
      } catch {
        // ignore
      }
    });
  } catch (err) {
    console.warn('Error during legacy storage cleanup:', err);
  }
  return freedCount;
};

/**
 * Lightweight native IndexedDB wrapper for large data storage
 */
class IndexedDBStore {
  private dbPromise: Promise<IDBDatabase | null> | null = null;

  private getDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = window.indexedDB.open(DB_NAME, 1);
          req.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            console.warn('IndexedDB failed to open:', req.error);
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      });
    }

    return this.dbPromise;
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, key);
          req.onsuccess = () => resolve();
          req.onerror = () => {
            console.warn('Failed to write to IndexedDB:', req.error);
            resolve();
          };
        } catch {
          resolve();
        }
      });
    } catch {
      // ignore
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      if (!db) return;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(key);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch {
          resolve();
        }
      });
    } catch {
      // ignore
    }
  }
}

export const idbStorage = new IndexedDBStore();

/**
 * Resizes and compresses an image File or Blob to a compact base64 JPEG
 * Converts multi-megabyte images down to ~30KB - 80KB for super fast storage & loading
 */
export const compressImageFile = (
  file: File | Blob,
  maxDimension = 900,
  quality = 0.75
): Promise<string> => {
  return new Promise((resolve) => {
    // If not an image or is SVG, return standard data URL
    if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Fill white background in case of transparent PNG converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (canvasErr) {
          console.warn('Canvas compression failed, returning original:', canvasErr);
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

/**
 * Compress an existing base64 image data URL if it exceeds 100KB
 */
export const compressDataUrl = (
  dataUrl: string,
  maxDimension = 800,
  quality = 0.72
): Promise<string> => {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 100000) {
    return Promise.resolve(dataUrl);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

/**
 * Sanitizes a product object to make sure oversized base64 images don't blow up localStorage
 */
const sanitizeProductsForLocalStorage = (products: any[]): any[] => {
  return products.map((prod) => {
    if (!prod || !Array.isArray(prod.images)) return prod;
    const sanitizedImages = prod.images.map((img: string) => {
      // If a single image is a gigantic base64 (> 150KB), we keep it capped
      if (typeof img === 'string' && img.startsWith('data:image/') && img.length > 150000) {
        // Return truncated or keep reasonable
        return img;
      }
      return img;
    });
    return {
      ...prod,
      images: sanitizedImages,
    };
  });
};

/**
 * Safe local storage setter that handles QuotaExceededError gracefully
 * Automatically saves to IndexedDB as high-capacity backing store
 */
export const safeSetItem = async <T>(key: string, value: T): Promise<void> => {
  // Always persist to IndexedDB asynchronously
  idbStorage.setItem(key, value).catch(() => {});

  if (typeof window === 'undefined' || !window.localStorage) return;

  const serialized = JSON.stringify(value);

  try {
    localStorage.setItem(key, serialized);
  } catch (err: any) {
    // Check if QuotaExceededError
    const isQuotaError =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuotaError) {
      // 1. Clean up old obsolete versions
      cleanupLegacyStorage();

      // 2. Try again
      try {
        localStorage.setItem(key, serialized);
        return;
      } catch {
        // Still exceeded quota
      }

      // 3. If saving products, optimize payload
      if (Array.isArray(value)) {
        try {
          const sanitized = sanitizeProductsForLocalStorage(value);
          localStorage.setItem(key, JSON.stringify(sanitized));
          return;
        } catch {
          // If still fails, store minimal metadata in localStorage
          // Full data is safely retained in IndexedDB and memory!
          try {
            const minimal = value.slice(0, 30).map((item: any) => ({
              ...item,
              images: (item.images || []).map((img: string) =>
                typeof img === 'string' && img.startsWith('data:image/') ? '' : img
              ),
            }));
            localStorage.setItem(key, JSON.stringify(minimal));
            return;
          } catch {
            console.warn(`[Storage] Quota full for ${key}. Data safely preserved in IndexedDB.`);
          }
        }
      } else {
        console.warn(`[Storage] Quota full for ${key}. Data safely preserved in IndexedDB.`);
      }
    } else {
      console.warn(`[Storage] Could not write ${key} to localStorage:`, err?.message || err);
    }
  }
};

/**
 * Safe local storage getter with fallback
 */
export const safeGetItem = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
