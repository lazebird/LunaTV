import { AdminConfig } from './admin.types';
import { Favorite, IStorage, PlayRecord, SkipConfig } from './types';

export class NoopStorage implements IStorage {
  getPlayRecord(): Promise<PlayRecord | null> {
    return Promise.resolve(null);
  }
  setPlayRecord(): Promise<void> {
    return Promise.resolve();
  }
  getAllPlayRecords(): Promise<{ [key: string]: PlayRecord }> {
    return Promise.resolve({});
  }
  deletePlayRecord(): Promise<void> {
    return Promise.resolve();
  }

  getFavorite(): Promise<Favorite | null> {
    return Promise.resolve(null);
  }
  setFavorite(): Promise<void> {
    return Promise.resolve();
  }
  getAllFavorites(): Promise<{ [key: string]: Favorite }> {
    return Promise.resolve({});
  }
  deleteFavorite(): Promise<void> {
    return Promise.resolve();
  }

  registerUser(): Promise<void> {
    return Promise.resolve();
  }
  verifyUser(): Promise<boolean> {
    return Promise.resolve(false);
  }
  checkUserExist(): Promise<boolean> {
    return Promise.resolve(false);
  }
  changePassword(): Promise<void> {
    return Promise.resolve();
  }
  deleteUser(): Promise<void> {
    return Promise.resolve();
  }

  getSearchHistory(): Promise<string[]> {
    return Promise.resolve([]);
  }
  addSearchHistory(): Promise<void> {
    return Promise.resolve();
  }
  deleteSearchHistory(): Promise<void> {
    return Promise.resolve();
  }

  getAllUsers(): Promise<string[]> {
    return Promise.resolve([]);
  }

  getAdminConfig(): Promise<AdminConfig | null> {
    return Promise.resolve(null);
  }
  setAdminConfig(): Promise<void> {
    return Promise.resolve();
  }

  getSkipConfig(): Promise<SkipConfig | null> {
    return Promise.resolve(null);
  }
  setSkipConfig(): Promise<void> {
    return Promise.resolve();
  }
  deleteSkipConfig(): Promise<void> {
    return Promise.resolve();
  }
  getAllSkipConfigs(): Promise<{ [key: string]: SkipConfig }> {
    return Promise.resolve({});
  }

  clearAllData(): Promise<void> {
    return Promise.resolve();
  }
}

export default NoopStorage;
