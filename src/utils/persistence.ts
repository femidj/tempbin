type Persistence = {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
};

const hasPersistentStorage = typeof window !== 'undefined' && (window as any).persistentStorage;

const asyncLocalStorage = {
  setItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },
  getItem(key: string) {
    try {
      const v = localStorage.getItem(key);
      return Promise.resolve(v);
    } catch (err) {
      return Promise.reject(err);
    }
  },
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },
  clear() {
    try {
      localStorage.clear();
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  },
};

export const persistence: Persistence = {
  setItem(key, value) {
    if (hasPersistentStorage) {
      return (window as any).persistentStorage.setItem(key, value);
    }
    return asyncLocalStorage.setItem(key, value);
  },
  getItem(key) {
    if (hasPersistentStorage) {
      return (window as any).persistentStorage.getItem(key);
    }
    return asyncLocalStorage.getItem(key);
  },
  removeItem(key) {
    if (hasPersistentStorage) {
      return (window as any).persistentStorage.removeItem(key);
    }
    return asyncLocalStorage.removeItem(key);
  },
  clear() {
    if (hasPersistentStorage) {
      return (window as any).persistentStorage.clear();
    }
    return asyncLocalStorage.clear();
  },
};