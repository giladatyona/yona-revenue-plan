import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection } from 'firebase/firestore';

// Firebase web config is meant to be public -- security is enforced by Firestore
// rules (see firestore rules restricting access to the single `app/state` doc),
// not by keeping this config secret.
const firebaseConfig = {
  apiKey: 'AIzaSyAPk8yLrb_o3qNeeu-uDBuGMLy3gYlSmTg',
  authDomain: 'yona-revenue-plan.firebaseapp.com',
  projectId: 'yona-revenue-plan',
  storageBucket: 'yona-revenue-plan.firebasestorage.app',
  messagingSenderId: '503270277504',
  appId: '1:503270277504:web:a3774bb10d5bbf2e430165',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const sharedStateDoc = doc(db, 'app', 'state');
export const plansCollection = collection(db, 'plans');
