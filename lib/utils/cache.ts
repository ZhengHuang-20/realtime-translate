interface CacheItem<T> {
  value: T;
  timestamp: number;
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的项
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

// 创建翻译和音频缓存实例
export const translationCache = new Cache<string>(100, 3600000);
export const audioCache = new Cache<string>(50, 3600000); 