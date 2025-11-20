// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFuCsy2rJktyV8ufPEgWfaZi-HM7H7eiA",
  authDomain: "pokeapi-b9545.firebaseapp.com",
  projectId: "pokeapi-b9545",
  storageBucket: "pokeapi-b9545.firebasestorage.app",
  messagingSenderId: "765251856086",
  appId: "1:765251856086:web:489ba3cb45a75011228b77",
  measurementId: "G-72LZZ6F9LG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };