import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADH2bp68nEQxRcgGXq83zZUR21cABHOe0",
  authDomain: "booking-hotel-be19e.firebaseapp.com",
  projectId: "booking-hotel-be19e",
  storageBucket: "booking-hotel-be19e.firebasestorage.app",
  messagingSenderId: "915958805225",
  appId: "1:915958805225:web:27755a6248d5c8965cb678",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); 