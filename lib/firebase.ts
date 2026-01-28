import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDyXr518sPESQevyVTMv6nWtjxPzJLc3aU",
    authDomain: "gestao-loja-pro.firebaseapp.com",
    projectId: "gestao-loja-pro",
    storageBucket: "gestao-loja-pro.firebasestorage.app",
    messagingSenderId: "788967928895",
    appId: "1:788967928895:web:048aa11a50d5d0ee7ef48a",
    measurementId: "G-RT2BSY0JTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
    ignoreUndefinedProperties: true
});
export default app;
