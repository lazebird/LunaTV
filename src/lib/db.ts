/* eslint-disable no-console, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import { AdminConfig } from './admin.types';
import { CloudflareKVStorage } from './cf-kv.db';
import { importKvrocksImpl, importRedisImpl } from './dynamic-imports';
import NoopStorage from './noopStorage';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { UpstashRedisStorage } from './upstash.db';

// 运行时安全读取 storage type，避免在模块顶层使用 `process` 导致 Edge 静态检测报错
function getStorageType():
  | 'localstorage'
  | 'redis'
  | 'upstash'
  | 'kvrocks'
  | 'cf-kv' {
  const proc = (globalThis as any)['process'];
  const env = proc?.env ?? (globalThis as any)['__NEXT_DATA__']?.env ?? {};
  return (
    (env.NEXT_PUBLIC_STORAGE_TYPE as
      | 'localstorage'
      | 'redis'
      | 'upstash'
      | 'kvrocks'
      | 'cf-kv'
      | undefined) || 'localstorage'
  );
}

let kvNamespace: KVNamespace | null = null;

export function setKVNamespace(kv: KVNamespace) {
  kvNamespace = kv;
}

// Node-only: 尝试获取底层原始存储实现（例如 redis/kvrocks）的客户端实例
// 这个函数会在运行时检查是否在 Node 环境中，并按需动态导入 Node-only 模块。
// 在 Edge 环境中或在构建期间会返回 null，避免将 Node-only 代码打包进 Edge 函数。
export async function getRawStorageClient(): Promise<unknown | null> {
  try {
    // 使用 bracket 访问避免静态分析识别出 Node 专用符号
    const proc = (globalThis as any)['process'];
    if (proc && proc.release && proc.release.name === 'node') {
      const STORAGE_TYPE = getStorageType();
      // 根据配置的存储类型动态导入对应实现
      if (STORAGE_TYPE === 'redis') {
        const mod = await importRedisImpl();
        return (
          (mod &&
            ((mod as any).redisClient ||
              (mod as any).RedisStorage ||
              (mod as any).default)) ||
          null
        );
      }
      if (STORAGE_TYPE === 'kvrocks') {
        const mod = await importKvrocksImpl();
        return (
          (mod &&
            ((mod as any).kvrocksClient ||
              (mod as any).KvrocksStorage ||
              (mod as any).default)) ||
          null
        );
      }
    }
  } catch (err) {
    console.warn('getRawStorageClient 动态导入失败或不可用:', err);
  }
  return null;
}

// 创建存储实例（异步，延迟导入 Node-only 模块）
async function createStorageAsync(): Promise<IStorage> {
  const STORAGE_TYPE = getStorageType();
  switch (STORAGE_TYPE) {
    case 'redis': {
      // Redis backend uses Node-only APIs and is not compatible with Edge builds.
      // For Cloudflare Pages build we return a noop storage to avoid bundling redis client.
      return new NoopStorage();
    }
    case 'upstash':
      return new UpstashRedisStorage();
    case 'kvrocks': {
      // Kvrocks is also Node-specific; use NoopStorage during build to avoid bundling.
      return new NoopStorage();
    }
    case 'cf-kv':
      if (!kvNamespace) {
        // 在构建或运行时绑定尚未建立时，返回一个 noop 实现，避免抛出
        return new NoopStorage();
      }
      return new CloudflareKVStorage(kvNamespace);
    case 'localstorage':
    default:
      // Localstorage or unknown storage types should fall back to a noop
      // implementation so callers never receive `null` and can safely call
      // methods without causing TypeErrors in runtime.
      return new NoopStorage();
  }
}

// 单例存储实例（promise）
let storageInstancePromise: Promise<IStorage> | null = null;

async function getStorageAsync(): Promise<IStorage> {
  if (storageInstancePromise) return storageInstancePromise;

  // 在 Next.js build 阶段，process.env.NEXT_PUBLIC_STORAGE_TYPE 可能是 'cf-kv'
  // 但此时 kvNamespace 还未被初始化，所以我们返回一个 NoopStorage，避免抛出
  const proc = (globalThis as any)['process'];
  const lifecycle = proc?.env?.npm_lifecycle_event;
  if (lifecycle === 'build' && getStorageType() === 'cf-kv') {
    return new NoopStorage();
  }

  storageInstancePromise = createStorageAsync();
  return storageInstancePromise;
}

// 工具函数：生成存储key
export function generateStorageKey(source: string, id: string): string {
  return `${source}+${id}`;
}

// 导出便捷方法
export class DbManager {
  // storage 将在第一次调用时异步解析
  private storagePromise: Promise<IStorage> | null = null;

  private async getStorage(): Promise<IStorage> {
    if (this.storagePromise) return this.storagePromise;
    this.storagePromise = getStorageAsync();
    return this.storagePromise;
  }

  // 播放记录相关方法
  async getPlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<PlayRecord | null> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    return storage.getPlayRecord(userName, key);
  }

  async savePlayRecord(
    userName: string,
    source: string,
    id: string,
    record: PlayRecord
  ): Promise<void> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    await storage.setPlayRecord(userName, key, record);
  }

  async getAllPlayRecords(userName: string): Promise<{
    [key: string]: PlayRecord;
  }> {
    const storage = await this.getStorage();
    return storage.getAllPlayRecords(userName);
  }

  async deletePlayRecord(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    await storage.deletePlayRecord(userName, key);
  }

  // 收藏相关方法
  async getFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<Favorite | null> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    return storage.getFavorite(userName, key);
  }

  async saveFavorite(
    userName: string,
    source: string,
    id: string,
    favorite: Favorite
  ): Promise<void> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    await storage.setFavorite(userName, key, favorite);
  }

  async getAllFavorites(
    userName: string
  ): Promise<{ [key: string]: Favorite }> {
    const storage = await this.getStorage();
    return storage.getAllFavorites(userName);
  }

  async deleteFavorite(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const storage = await this.getStorage();
    const key = generateStorageKey(source, id);
    await storage.deleteFavorite(userName, key);
  }

  async isFavorited(
    userName: string,
    source: string,
    id: string
  ): Promise<boolean> {
    const favorite = await this.getFavorite(userName, source, id);
    return favorite !== null;
  }

  // ---------- 用户相关 ----------
  async registerUser(userName: string, password: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.registerUser(userName, password);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const storage = await this.getStorage();
    return storage.verifyUser(userName, password);
  }

  // 检查用户是否已存在
  async checkUserExist(userName: string): Promise<boolean> {
    const storage = await this.getStorage();
    return storage.checkUserExist(userName);
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.changePassword(userName, newPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.deleteUser(userName);
  }

  // ---------- 搜索历史 ----------
  async getSearchHistory(userName: string): Promise<string[]> {
    const storage = await this.getStorage();
    return storage.getSearchHistory(userName);
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.addSearchHistory(userName, keyword);
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.deleteSearchHistory(userName, keyword);
  }

  // 获取全部用户名
  async getAllUsers(): Promise<string[]> {
    const storage = await this.getStorage();
    if (typeof (storage as any).getAllUsers === 'function') {
      return (storage as any).getAllUsers();
    }
    return [];
  }

  // ---------- 管理员配置 ----------
  async getAdminConfig(): Promise<AdminConfig | null> {
    const storage = await this.getStorage();
    if (typeof (storage as any).getAdminConfig === 'function') {
      return (storage as any).getAdminConfig();
    }
    return null;
  }

  async saveAdminConfig(config: AdminConfig): Promise<void> {
    const storage = await this.getStorage();
    if (typeof (storage as any).setAdminConfig === 'function') {
      await (storage as any).setAdminConfig(config);
    }
  }

  // ---------- 跳过片头片尾配置 ----------
  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<SkipConfig | null> {
    const storage = await this.getStorage();
    if (typeof (storage as any).getSkipConfig === 'function') {
      return (storage as any).getSkipConfig(userName, source, id);
    }
    return null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig
  ): Promise<void> {
    const storage = await this.getStorage();
    if (typeof (storage as any).setSkipConfig === 'function') {
      await (storage as any).setSkipConfig(userName, source, id, config);
    }
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    const storage = await this.getStorage();
    if (typeof (storage as any).deleteSkipConfig === 'function') {
      await (storage as any).deleteSkipConfig(userName, source, id);
    }
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: SkipConfig }> {
    const storage = await this.getStorage();
    if (typeof (storage as any).getAllSkipConfigs === 'function') {
      return (storage as any).getAllSkipConfigs(userName);
    }
    return {};
  }

  // ---------- 数据清理 ----------
  async clearAllData(): Promise<void> {
    const storage = await this.getStorage();
    if (typeof (storage as any).clearAllData === 'function') {
      await (storage as any).clearAllData();
    } else {
      throw new Error('存储类型不支持清空数据操作');
    }
  }
}

// 导出默认实例
export const db = new DbManager();
