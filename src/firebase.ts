import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get, runTransaction } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDQ7eliurQ3DSvGKt-obyfYYFXFAJ0--II",
  authDomain: "student-voiting.firebaseapp.com",
  databaseURL: "https://student-voiting-default-rtdb.firebaseio.com",
  projectId: "student-voiting",
  storageBucket: "student-voiting.firebasestorage.app",
  messagingSenderId: "391669808479",
  appId: "1:391669808479:web:596ac84172cb8ea33d0aea"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

const BASE_PATH = import.meta.env.VITE_PROJECT_PATH;

export const dbPath = (path: string): string => `${BASE_PATH}/${path}`;

export class FirebaseService {
  static async getData<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, dbPath(path));
    return new Promise<T | null>((resolve) => {
      onValue(dataRef, (snapshot) => {
        resolve(snapshot.val() as T | null);
      }, { onlyOnce: true });
    });
  }

  static async setData<T = unknown>(path: string, data: T): Promise<void> {
    const dataRef = ref(db, dbPath(path));
    await set(dataRef, data);
  }

  static async removeData(path: string): Promise<void> {
    const dataRef = ref(db, dbPath(path));
    await set(dataRef, null);
  }

  static async updateData(path: string, updates: Record<string, unknown>): Promise<void> {
    const dataRef = ref(db, dbPath(path));
    await update(dataRef, updates);
  }

  static async getSnapshot<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, dbPath(path));
    const snapshot = await get(dataRef);
    return snapshot.val() as T | null;
  }

  static async runTransaction<T>(
    path: string,
    updateFn: (current: T | null) => T | undefined,
  ): Promise<{ committed: boolean; snapshot: T | null }> {
    const dataRef = ref(db, dbPath(path));
    const result = await runTransaction(dataRef, (current) => updateFn(current as T | null));
    return {
      committed: result.committed,
      snapshot: result.snapshot.val() as T | null,
    };
  }
}

export default FirebaseService;
