// Utility functions for storing and retrieving files using IndexedDB

const DB_NAME = 'paperbase-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Check if existing connection is still valid
    if (db) {
      try {
        // Verify the connection is still open
        if (db.objectStoreNames.contains(STORE_NAME)) {
          resolve(db);
          return;
        } else {
          // Connection is invalid, reset it
          db = null;
        }
      } catch (error) {
        // Connection is closed or invalid, reset itdb = null;
      }
    }const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;// Set up error handlers
      db.onerror = (event) => {};
      
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

export const saveFile = async (documentId: string, file: File): Promise<void> => {try {
    if (!file || !(file instanceof File)) {
      const error = new Error(`Invalid file object provided: ${typeof file}`);throw error;
    }// Convert File to ArrayBuffer FIRST (before creating transaction)
    // This is important because IndexedDB transactions auto-close if there are no pending requestsconst arrayBuffer = await file.arrayBuffer();
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('File arrayBuffer is empty');
    }// NOW create the database connection and transaction
    const database = await openDB();// Verify object store exists
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      throw new Error(`Object store "${STORE_NAME}" does not exist`);
    }const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);// Wait for both the put request AND the transaction to complete
    await new Promise<void>((resolve, reject) => {
      let requestSucceeded = false;
      let transactionCompleted = false;
      
      const checkComplete = () => {
        if (requestSucceeded && transactionCompleted) {resolve();
        }
      };
      
      const request = store.put(arrayBuffer, documentId);
      
      request.onsuccess = () => {requestSucceeded = true;
        checkComplete();
      };
      
      request.onerror = () => {reject(request.error || new Error('Put request failed'));
      };
      
      // Wait for transaction to complete (this ensures data is actually written)
      transaction.oncomplete = () => {transactionCompleted = true;
        checkComplete();
      };
      
      transaction.onerror = () => {reject(transaction.error || new Error('Transaction failed'));
      };
      
      transaction.onabort = () => {reject(new Error('Transaction was aborted'));
      };
    });
    
    // Verification only in development mode (trust transaction completion in production)
    if (import.meta.env.DEV) {const verifyTransaction = database.transaction([STORE_NAME], 'readonly');
      const verifyStore = verifyTransaction.objectStore(STORE_NAME);
      const verifyRequest = verifyStore.get(documentId);
      
      await new Promise<void>((resolve, reject) => {
        verifyRequest.onsuccess = () => {
          if (verifyRequest.result) {resolve();
          } else {// Don't reject in dev mode, just warn
            resolve();
          }
        };
        verifyRequest.onerror = () => {// Don't reject in dev mode, just warn
          resolve();
        };
      });
    }
    
  } catch (error) {throw error;
  }
};

// Helper function to list all keys in IndexedDB (for debugging)
const getAllKeys = async (): Promise<string[]> => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = request.result as string[];resolve(keys);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {return [];
  }
};

export const getFile = async (documentId: string, fileName: string, fileType: string): Promise<File | null> => {
  try {const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const arrayBuffer = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const request = store.get(documentId);
      request.onsuccess = () => {
        if (request.result) {} else {}
        resolve(request.result || null);
      };
      request.onerror = () => {reject(request.error);
      };
    });

    if (!arrayBuffer) {return null;
    }

    // Recreate File object from ArrayBuffer using provided metadata
    const file = new File([arrayBuffer], fileName, { type: fileType });return file;
  } catch (error) {return null;
  }
};

export const deleteFile = async (documentId: string): Promise<void> => {
  try {
    const database = await openDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(documentId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });} catch (error) {throw error;
  }
};






