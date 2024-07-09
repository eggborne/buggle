// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC0W8wZ1EPHWR3ww-78xlVFshSAYf3PBSA",
  authDomain: "buggle-live.firebaseapp.com",
  databaseURL: "https://buggle-live-default-rtdb.firebaseio.com",
  projectId: "buggle-live",
  storageBucket: "buggle-live.appspot.com",
  messagingSenderId: "903236043431",
  appId: "1:903236043431:web:424860d5e264dde0d95182",
  measurementId: "G-NQRFLL0EDF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// const analytics = getAnalytics(app);

console.warn('Firebase initialized.')

export {
  database
}

