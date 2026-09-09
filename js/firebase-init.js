// js/firebase-init.js
// Configuración única de Firebase (compat SDK 10.12.0).
// Cargar SIEMPRE después de firebase-app-compat.js y firebase-database-compat.js.
firebase.initializeApp({
  apiKey: "AIzaSyDcstZpX0ji9HAdK9POboYQPTMcc6utC1E",
  authDomain: "browser-songs.firebaseapp.com",
  databaseURL: "https://browser-songs-default-rtdb.firebaseio.com",
  projectId: "browser-songs"
});
window.db = firebase.database();