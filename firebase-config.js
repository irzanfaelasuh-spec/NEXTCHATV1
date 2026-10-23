// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAf_EZq-LF5I1z71RV3emSiLL6Orbh2I14",
  authDomain: "nexchat-d67ce.firebaseapp.com",
  projectId: "nexchat-d67ce",
  storageBucket: "nexchat-d67ce.firebasestorage.app",
  messagingSenderId: "512208058388",
  appId: "1:512208058388:web:96e40733ab71f61fd9cf01",
  measurementId: "G-C0JBERS5ER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
