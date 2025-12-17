// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBaMUCsLMY_ceLUQqBh0ap_u9O4BMowMpg",
  authDomain: "escrowstack-99bcd.firebaseapp.com",
  projectId: "escrowstack-99bcd",
  storageBucket: "escrowstack-99bcd.firebasestorage.app",
  messagingSenderId: "1043331679066",
  appId: "1:1043331679066:web:e057337a103314d9596963"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
