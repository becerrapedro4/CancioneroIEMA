// js/viewer.js
import { db } from "./firebase-config.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

// Obtener room de la URL
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");

// Elementos
const waitingMsg = document.getElementById("waiting-message");
const titleEl = document.getElementById("song-title");
const lyricsEl = document.getElementById("song-lyrics");
const root = document.documentElement;

if (!roomId) {
  waitingMsg.textContent = "Error: falta el parámetro ?room=... en la URL";
} else {
  const roomRef = ref(db, `rooms/${roomId}`);

  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();

    // Color de fondo
    if (data?.config?.bgColor) {
      root.style.setProperty("--bg-color", data.config.bgColor);
    }

    // Canción actual
    if (data?.currentSong) {
      waitingMsg.style.display = "none";
      titleEl.style.display = "block";
      lyricsEl.style.display = "block";

      titleEl.textContent = data.currentSong.titulo;
      lyricsEl.textContent = data.currentSong.letra;
    } else {
      waitingMsg.style.display = "block";
      titleEl.style.display = "none";
      lyricsEl.style.display = "none";
    }
  }, (error) => {
    console.error("Error en la conexión:", error);
    waitingMsg.textContent = "Error de conexión. Reintentando...";
  });
}

// Fondo animado de partículas (mismo código del HTML anterior)
function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    const size = Math.random() * 5 + 2;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.top = Math.random() * 100 + "%";
    particle.style.animationDuration = (Math.random() * 10 + 10) + "s";
    particle.style.animationDelay = Math.random() * 10 + "s";
    container.appendChild(particle);
  }
}
createParticles();
