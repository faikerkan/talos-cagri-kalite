/**
 * In-memory cache utility
 * Bu modül, backend uygulamasında önbellek (cache) kullanımını sağlar.
 * Veritabanı sorgularının sonuçlarını veya sık kullanılan API yanıtlarını önbellekte saklayabilir.
 */

import { customLogger } from './logger';

interface CacheItem<T> {
  value: T;
  expiry: number | null; // Unix timestamp (milliseconds), null means never expires
}

class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number; // milliseconds
  private maxSize: number;

  constructor(defaultTTL = 5 * 60 * 1000, maxSize = 100) { // 5 dakika varsayılan TTL
    this.cache = new Map<string, CacheItem<any>>();
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  /**
   * Önbellekten veri alır
   * @param key Önbellek anahtarı
   * @returns Önbellekteki değer veya undefined (eğer önbellekte yoksa veya süresi dolmuşsa)
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Önbellekte yoksa undefined dön
    if (!item) {
      return undefined;
    }
    
    // Süresi dolmuş mu kontrol et
    if (item.expiry !== null && Date.now() > item.expiry) {
      // Süresi dolmuş, önbellekten kaldır
      this.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }

  /**
   * Önbelleğe veri ekler
   * @param key Önbellek anahtarı 
   * @param value Saklanacak değer
   * @param ttl Millisaniye cinsinden yaşam süresi (Time To Live), null verisi sonsuz yaşam süresini ifade eder
   */
  set<T>(key: string, value: T, ttl: number | null = this.defaultTTL): void {
    // Önbellek boyutunu kontrol et
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const expiry = ttl === null ? null : Date.now() + ttl;
    
    this.cache.set(key, {
      value,
      expiry
    });
    
    customLogger.debug(`Cache: Key "${key}" set${ttl ? ` with TTL ${ttl}ms` : ' (infinite)'}`);
  }

  /**
   * Önbellekteki bir öğeyi siler
   * @param key Silinecek öğenin anahtarı
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Önbelleği tamamen temizler
   */
  clear(): void {
    this.cache.clear();
    customLogger.info('Cache: Completely cleared');
  }

  /**
   * En eski öğeyi önbellekten çıkarır
   * Not: Basit bir yaklaşım, genellikle LRU (Least Recently Used) algoritması daha iyi olurdu
   */
  private evictOldest(): void {
    // İlk öğeyi sil (Map veri yapısının özelliği gereği ilk eklenen ilk burada olacak)
    if (this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value as string;
      this.cache.delete(firstKey);
      customLogger.debug(`Cache: Evicted oldest item with key "${firstKey}"`);
    }
  }

  /**
   * Önbellekteki öğe sayısını döndürür
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Süresi dolmuş tüm öğeleri temizler
   * Bu metod düzenli aralıklarla çağrılabilir
   */
  cleanExpired(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry !== null && now > item.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      customLogger.debug(`Cache: Cleaned ${removed} expired items`);
    }
  }
}

// Tek bir global önbellek örneği oluştur
const globalCache = new CacheManager();

export default globalCache; 