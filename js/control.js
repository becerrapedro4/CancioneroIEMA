// js/control.js
import { db } from "./firebase-config.js";
import {
  ref,
  set,
  update,
  onValue
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

// Verificar sesión
const username = localStorage.getItem("cancionero_username");
if (!username) {
  window.location.href = "login.html";
}

const roomId = username;

// Elementos DOM
const roomNameSpan = document.getElementById("room-name");
const viewerUrlSpan = document.getElementById("viewer-url");
const copyBtn = document.getElementById("copy-url-btn");
const songSelect = document.getElementById("song-select");
const sendSongBtn = document.getElementById("send-song-btn");
const bgColorInput = document.getElementById("bg-color");
const applyColorBtn = document.getElementById("apply-color-btn");
const logoutBtn = document.getElementById("logout-btn");

// Mostrar datos de la sala
roomNameSpan.textContent = roomId;
const viewerUrl = `${window.location.origin}${window.location.pathname.replace("control.html", "viewer.html")}?room=${encodeURIComponent(roomId)}`;
viewerUrlSpan.textContent = viewerUrl;

copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(viewerUrl).then(() => alert("URL copiada"));
});

// Canciones de ejemplo (mock)
const songs = [
  { id: 1, titulo: "DING DIN DONG", letra: "Ding din dong, ding din dong...\nSuenan las campanas hoy.\nDing din dong, ding din dong...\nCristo el Salvador nació." },
  { id: 2, titulo: "NOCHE DE PAZ", letra: "Noche de paz, noche de amor,\nTodo duerme en derredor.\nEntre sus astros que esparcen su luz,\nBella anunciando al niño Jesús." },
  { id: 3, titulo: "OH VEN EMANUEL (BOSSA)", letra: "Oh ven, oh ven, Emanuel,\nLiberta al cautivo Israel.\nQue sufre desterrado aquí,\nY espera al Hijo de David." }
];

// Llenar selector
songs.forEach((song) => {
  const opt = document.createElement("option");
  opt.value = song.id;
  opt.textContent = song.titulo;
  songSelect.appendChild(opt);
});

// Enviar canción
sendSongBtn.addEventListener("click", () => {
  const songId = parseInt(songSelect.value);
  if (!songId) {
    alert("Seleccioná una canción");
    return;
  }
  const song = songs.find((s) => s.id === songId);
  if (song) {
    set(ref(db, `rooms/${roomId}/currentSong`), {
      id: song.id,
      titulo: song.titulo,
      letra: song.letra,
      timestamp: Date.now()
    }).catch((err) => console.error("Error al enviar canción:", err));
  }
});

// Cambiar color de fondo
applyColorBtn.addEventListener("click", () => {
  const color = bgColorInput.value;
  update(ref(db, `rooms/${roomId}/config`), { bgColor: color }).catch((err) =>
    console.error("Error al cambiar color:", err)
  );
});

// Escuchar cambios de configuración (para cargar color actual)
onValue(ref(db, `rooms/${roomId}`), (snapshot) => {
  const data = snapshot.val();
  if (data?.config?.bgColor) {
    bgColorInput.value = data.config.bgColor;
  }
});

// Cerrar sesión
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("cancionero_username");
  localStorage.removeItem("cancionero_room");
  window.location.href = "login.html";
});
