// js/login.js
import { db } from "./firebase-config.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-database.js";

// Si ya hay sesión, redirigir directamente a control
if (localStorage.getItem("cancionero_username")) {
  window.location.href = "control.html";
}

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  if (!username) return;

  localStorage.setItem("cancionero_username", username);
  localStorage.setItem("cancionero_room", username);

  // Opcional: crear estructura inicial en Firebase
  set(ref(db, `rooms/${username}/config`), { bgColor: "#1a1a2e" }).catch(console.error);

  window.location.href = "control.html";
});
