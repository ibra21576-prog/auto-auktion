import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey:            'AIzaSyC2P0o_VUtfFy2qQDMuyZmvwXMOT0KNZ-I',
  authDomain:        'autobid-5e23d.firebaseapp.com',
  projectId:         'autobid-5e23d',
  storageBucket:     'autobid-5e23d.firebasestorage.app',
  messagingSenderId: '901745420058',
  appId:             '1:901745420058:web:c396c3849776cee54e6ea3',
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
