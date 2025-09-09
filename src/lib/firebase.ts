
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your existing config
export const firebaseConfig = {
  "projectId": "campusc-working",
  "appId": "1:935230427973:web:1d037a99dc0cf35658a42c",
  "storageBucket": "campusc-working.appspot.com",
  "apiKey": "AIzaSyCiJTljEbnWD6bwznbm3jFGRlwueNWSFg4",
  "authDomain": "campusc-working.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "935230427973"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
