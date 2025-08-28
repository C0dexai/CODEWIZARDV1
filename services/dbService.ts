import type { FileSystemState, ChatMessage } from '../types';

const DB_NAME = 'LiveDevSandboxDB';
const DB_VERSION = 3; // Version bump for new state structure
const STORE_NAME = 'sandboxState';
const STATE_KEY = 'currentState';

interface AppState {
    chatHistory: ChatMessage[];
    fileSystem: FileSystemState;
    panelSizes: number[];
    rightPanelVerticalSplit: number;
    previewRoot: string | null;
    openFiles: string[];
    activeFile: string | null;
    customInstructions: string;
    modelName: string;
}

class IndexedDBService {
    private db: IDBDatabase | null = null;

    public initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve();
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject('Error opening IndexedDB.');
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    public saveState(state: AppState): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('DB not initialized.');
                return;
            }

            try {
                const transaction = this.db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(state, STATE_KEY);

                request.onsuccess = () => resolve();
                request.onerror = () => {
                    console.error('Error saving state:', request.error);
                    reject('Could not save state to IndexedDB.');
                };
            } catch (error) {
                console.error("Error creating transaction for saving state:", error);
                reject(error);
            }
        });
    }

    public loadState(): Promise<AppState | null> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject('DB not initialized.');
                return;
            }

            try {
                const transaction = this.db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(STATE_KEY);

                request.onsuccess = () => {
                    const loadedState = request.result as AppState | null;
                    if (loadedState) {
                         // Backwards compatibility for chat message IDs
                        if (loadedState.chatHistory && !loadedState.chatHistory[0]?.id) {
                            loadedState.chatHistory = loadedState.chatHistory.map(msg => ({...msg, id: crypto.randomUUID() }));
                        }
                        // Backwards compatibility for new layout state
                        if (typeof loadedState.rightPanelVerticalSplit === 'undefined') {
                            loadedState.rightPanelVerticalSplit = 60;
                        }
                         // Backwards compatibility for custom instructions
                        if (typeof loadedState.customInstructions === 'undefined') {
                            loadedState.customInstructions = ''; 
                        }
                        // Backwards compatibility for model name
                        if (typeof loadedState.modelName === 'undefined' || !loadedState.modelName) {
                            loadedState.modelName = 'gemini-2.5-flash';
                        }
                    }
                    resolve(loadedState);
                };
                
                request.onerror = () => {
                    console.error('Error loading state:', request.error);
                    reject('Could not load state from IndexedDB.');
                };
            } catch (error) {
                 console.error("Error creating transaction for loading state:", error);
                 reject(error);
            }
        });
    }
}

const dbService = new IndexedDBService();
export default dbService;