// Global File Store - Stores files by content hash (SHA-256)
// This prevents duplicate storage of identical files across projects

const DB_NAME = 'paperbase-global-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

export interface GlobalFile {
  fileHash: string;
  fileType: string;
  size: number;
  buffer: ArrayBuffer;
  createdAt: string;
}

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      try {
        if (db.objectStoreNames.contains(STORE_NAME)) {
          resolve(db);
          return;
        } else {
          db = null;
        }
      } catch (error) {db = null;
      }
    }const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;db.onerror = (event) => {};
      
      db.onclose = () => {db = null;
      };
      
      resolve(db);
    };

    request.onupgradeneeded = (event) => {const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME);}
    };
  });
};

/**
 * Check if a file exists in the global store by hash
 */
export const hasGlobalFile = async (fileHash: string): Promise<boolean> => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(fileHash);
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {return false;
  }
};

/**
 * Save a file to the global store (keyed by fileHash)
 * Only saves if the file doesn't already exist
 */
export const saveGlobalFile = async (fileHash: string, file: File): Promise<void> => {
  try {
    // Check if file already exists
    const exists = await hasGlobalFile(fileHash);
    if (exists) {return;
    }const arrayBuffer = await file.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File arrayBuffer is empty');
    }
    
    const globalFile: GlobalFile = {
      fileHash,
      fileType: file.type,
      size: file.size,
      buffer: arrayBuffer,
      createdAt: new Date().toISOString(),
    };
    
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      let requestSucceeded = false;
      let transactionCompleted = false;
      
      const checkComplete = () => {
        if (requestSucceeded && transactionCompleted) {resolve();
        }
      };
      
      const request = store.put(globalFile, fileHash);
      
      request.onsuccess = () => {
        requestSucceeded = true;
        checkComplete();
      };
      
      request.onerror = () => {reject(request.error || new Error('Put request failed'));
      };
      
      transaction.oncomplete = () => {
        transactionCompleted = true;
        checkComplete();
      };
      
      transaction.onerror = () => {reject(transaction.error || new Error('Transaction failed'));
      };
    });
  } catch (error) {throw error;
  }
};

/**
 * Get a file from the global store by hash
 */
export const getGlobalFile = async (fileHash: string, fileName: string): Promise<File | null> => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const globalFile = await new Promise<GlobalFile | null>((resolve, reject) => {
      const request = store.get(fileHash);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });

    if (!globalFile) {return null;
    }

    // Recreate File object from stored buffer
    const file = new File([globalFile.buffer], fileName, { type: globalFile.fileType });return file;
  } catch (error) {return null;
  }
};

/**
 * Delete a file from the global store (use with caution - only if no references exist)
 */
export const deleteGlobalFile = async (fileHash: string): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(fileHash);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });} catch (error) {throw error;
  }
};

