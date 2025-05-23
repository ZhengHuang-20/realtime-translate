interface CacheItem<T> {
  value: T;
  timestamp: number;
  lastAccessed: number; // 添加最后访问时间
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

  set(key: string, value: T, customTtl?: number): void {
    if (this.cache.size >= this.maxSize) {
      // 使用LRU策略 - 删除最久未访问的项
      let oldestKey: string | undefined;
      let oldestAccess = Date.now();
      
      for (const [k, item] of this.cache.entries()) {
        if (item.lastAccessed < oldestAccess) {
          oldestAccess = item.lastAccessed;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    const now = Date.now();
    this.cache.set(key, { 
      value, 
      timestamp: now,
      lastAccessed: now
    });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // 更新最后访问时间
    item.lastAccessed = Date.now();
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

// 创建翻译和音频缓存实例
export const translationCache = new Cache<string>(100, 3600000);
export const audioCache = new Cache<string>(50, 3600000);