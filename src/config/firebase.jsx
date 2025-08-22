import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Your Firebase config here
  apiKey: "AIzaSyCkEiFWtr9_T0ySauQYAWTn3pwJMcTQkTQ",
  authDomain: "sabesp-b5126.firebaseapp.com",
  projectId: "sabesp-b5126",
  storageBucket: "sabesp-b5126.firebasestorage.app",
  messagingSenderId: "401731339481",
  appId: "1:401731339481:web:b67e91b627617a157caac8",
  measurementId: "G-6BEZ3MJFG0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);