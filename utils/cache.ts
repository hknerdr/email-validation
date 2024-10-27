// utils/cache.ts
interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class Cache<T = any> {
  private store: Map<string, CacheEntry<T>>;
  private ttl: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.store = new Map();
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // Default 24 hours
    this.maxSize = options.maxSize || 10000; // Default 10k entries
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize) {
      // Remove oldest entry
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}