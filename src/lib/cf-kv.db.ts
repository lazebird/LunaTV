
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';
import { AdminConfig } from './admin.types';
import { hashPassword, verifyPassword } from './crypto';

export class CloudflareKVStorage implements IStorage {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  async getPlayRecord(userName: string, key: string): Promise<PlayRecord | null> {
    const value = await this.kv.get(`playrecord:${userName}:${key}`);
    return value ? JSON.parse(value) : null;
  }

  async setPlayRecord(
    userName: string,
    key: string,
    record: PlayRecord
  ): Promise<void> {
    await this.kv.put(
      `playrecord:${userName}:${key}`,
      JSON.stringify(record)
    );
  }

  async getAllPlayRecords(
    userName: string
  ): Promise<{ [key: string]: PlayRecord }> {
    const prefix = `playrecord:${userName}:`;
    const list = await this.kv.list({ prefix });
    const records: { [key: string]: PlayRecord } = {};
    for (const key of list.keys) {
      const value = await this.kv.get(key.name);
      if (value) {
        records[key.name.substring(prefix.length)] = JSON.parse(value);
      }
    }
    return records;
  }

  async deletePlayRecord(userName: string, key: string): Promise<void> {
    await this.kv.delete(`playrecord:${userName}:${key}`);
  }

  async getFavorite(userName: string, key: string): Promise<Favorite | null> {
    const value = await this.kv.get(`favorite:${userName}:${key}`);
    return value ? JSON.parse(value) : null;
  }

  async setFavorite(
    userName: string,
    key: string,
    favorite: Favorite
  ): Promise<void> {
    await this.kv.put(`favorite:${userName}:${key}`, JSON.stringify(favorite));
  }

  async getAllFavorites(
    userName: string
  ): Promise<{ [key: string]: Favorite }> {
    const prefix = `favorite:${userName}:`;
    const list = await this.kv.list({ prefix });
    const favorites: { [key: string]: Favorite } = {};
    for (const key of list.keys) {
      const value = await this.kv.get(key.name);
      if (value) {
        favorites[key.name.substring(prefix.length)] = JSON.parse(value);
      }
    }
    return favorites;
  }

  async deleteFavorite(userName: string, key: string): Promise<void> {
    await this.kv.delete(`favorite:${userName}:${key}`);
  }

  async registerUser(userName: string, password: string): Promise<void> {
    const hashedPassword = await hashPassword(password);
    await this.kv.put(`user:${userName}`, hashedPassword);
  }

  async verifyUser(userName: string, password: string): Promise<boolean> {
    const hashedPassword = await this.kv.get(`user:${userName}`);
    if (!hashedPassword) {
      return false;
    }
    return verifyPassword(password, hashedPassword);
  }

  async checkUserExist(userName: string): Promise<boolean> {
    return (await this.kv.get(`user:${userName}`)) !== null;
  }

  async changePassword(userName: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await this.kv.put(`user:${userName}`, hashedPassword);
  }

  async deleteUser(userName: string): Promise<void> {
    await this.kv.delete(`user:${userName}`);
    // also delete other user data
    const playRecords = await this.kv.list({ prefix: `playrecord:${userName}:` });
    for (const key of playRecords.keys) {
      await this.kv.delete(key.name);
    }
    const favorites = await this.kv.list({ prefix: `favorite:${userName}:` });
    for (const key of favorites.keys) {
      await this.kv.delete(key.name);
    }
    await this.kv.delete(`searchhistory:${userName}`);
    const skipConfigs = await this.kv.list({ prefix: `skipconfig:${userName}:` });
    for (const key of skipConfigs.keys) {
      await this.kv.delete(key.name);
    }
  }

  async getSearchHistory(userName: string): Promise<string[]> {
    const value = await this.kv.get(`searchhistory:${userName}`);
    return value ? JSON.parse(value) : [];
  }

  async addSearchHistory(userName: string, keyword: string): Promise<void> {
    let history = await this.getSearchHistory(userName);
    history = [keyword, ...history.filter((k) => k !== keyword)].slice(0, 20);
    await this.kv.put(
      `searchhistory:${userName}`,
      JSON.stringify(history)
    );
  }

  async deleteSearchHistory(userName: string, keyword?: string): Promise<void> {
    if (keyword) {
      let history = await this.getSearchHistory(userName);
      history = history.filter((k) => k !== keyword);
      await this.kv.put(
        `searchhistory:${userName}`,
        JSON.stringify(history)
      );
    } else {
      await this.kv.delete(`searchhistory:${userName}`);
    }
  }

  async getAllUsers(): Promise<string[]> {
    const list = await this.kv.list({ prefix: 'user:' });
    return list.keys.map((key) => key.name.substring('user:'.length));
  }

  async getAdminConfig(): Promise<AdminConfig | null> {
    const value = await this.kv.get('admin:config');
    return value ? JSON.parse(value) : null;
  }

  async setAdminConfig(config: AdminConfig): Promise<void> {
    await this.kv.put('admin:config', JSON.stringify(config));
  }

  async getSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<SkipConfig | null> {
    const value = await this.kv.get(`skipconfig:${userName}:${source}:${id}`);
    return value ? JSON.parse(value) : null;
  }

  async setSkipConfig(
    userName: string,
    source: string,
    id: string,
    config: SkipConfig
  ): Promise<void> {
    await this.kv.put(
      `skipconfig:${userName}:${source}:${id}`,
      JSON.stringify(config)
    );
  }

  async deleteSkipConfig(
    userName: string,
    source: string,
    id: string
  ): Promise<void> {
    await this.kv.delete(`skipconfig:${userName}:${source}:${id}`);
  }

  async getAllSkipConfigs(
    userName: string
  ): Promise<{ [key: string]: SkipConfig }> {
    const prefix = `skipconfig:${userName}:`;
    const list = await this.kv.list({ prefix });
    const configs: { [key: string]: SkipConfig } = {};
    for (const key of list.keys) {
      const value = await this.kv.get(key.name);
      if (value) {
        configs[key.name.substring(prefix.length)] = JSON.parse(value);
      }
    }
    return configs;
  }

  async clearAllData(): Promise<void> {
    const keys = await this.kv.list();
    for (const key of keys.keys) {
      await this.kv.delete(key.name);
    }
  }
}
