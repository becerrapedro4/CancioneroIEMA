// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcstZpX0ji9HAdK9POboYQPTMcc6utC1E",
  authDomain: "browser-songs.firebaseapp.com",
  databaseURL: "https://browser-songs-default-rtdb.firebaseio.com",
  projectId: "browser-songs",
  storageBucket: "browser-songs.firebasestorage.app",
  messagingSenderId: "665974000150",
  appId: "1:665974000150:web:72187dd8ee24024e410337",
  measurementId: "G-QNT3346SCX"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
