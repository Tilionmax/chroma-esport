import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyBVhYA-HBtN3rG8q0Aj0EfhCsEJ3Nz8jPA",
  authDomain: "chroma-esport.firebaseapp.com",
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.appspot.com",
  messagingSenderId: "555749328122",
  appId: "1:555749328122:web:5765da259633ef047e3543"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* VARIABLES */
let calendar;
let selectedDate = null;
let selectedDay = new Date().toISOString().split("T")[0];
let selectedEvent = null;

let currentPlayer = localStorage.getItem("playerName") || "";

/* MODAL USER */
const userModal = document.getElementById("userModal");

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");
  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events,

    validRange: {
      start: new Date().toISOString().split("T")[0]
    },

    dateClick: (info) => {

      const today = new Date().toISOString().split("T")[0];
      if (info.dateStr < today) return;

      selectedDate = info.dateStr;
      selectedDay = info.dateStr;

      renderWeek();
      renderPlayersForDay();
      openAvailModal();
    },

    eventClick: (info) => openEditModal(info.event)
  });

  calendar.render();

  /* EVENTS */
  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);

  document.getElementById("changePlayerBtn").addEventListener("click", () => {
    document.getElementById("newUsername").value = currentPlayer;
    userModal.classList.remove("hidden");
  });

  document.getElementById("closeUserBtn").addEventListener("click", () => {
    userModal.classList.add("hidden");
  });

  document.getElementById("saveUserBtn").addEventListener("click", () => {
    const name = document.getElementById("newUsername").value.trim();
    if (!name) return;

    currentPlayer = name;
    localStorage.setItem("playerName", name);

    updatePlayerUI();
    userModal.classList.add("hidden");
  });

  updatePlayerUI();
  renderWeek();
  renderPlayersForDay();
});

/* USER UI */
function updatePlayerUI() {
  const text = document.getElementById("playerText");
  const input = document.getElementById("playerName");

  if (!currentPlayer) {
    text.textContent = "Not connected";
    return;
  }

  text.textContent = "Connected as: " + currentPlayer;
  input.value = currentPlayer;
}

/* WEEK */
function renderWeek() {

  const today = new Date();
  let days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  const container = document.getElementById("weekDays");
  container.innerHTML = "";

  document.getElementById("weekRange").textContent =
    `📅 Semaine du ${days[0].toLocaleDateString("fr-FR")} → ${days[6].toLocaleDateString("fr-FR")}`;

  days.forEach(d => {
    const iso = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "week-day";

    if (iso === selectedDay) div.classList.add("active");

    div.textContent = d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit"
    });

    div.onclick = () => {
      selectedDay = iso;
      renderWeek();
      renderPlayersForDay();
    };

    container.appendChild(div);
  });
}

/* LOAD */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `🟢 ${d.player} (${d.start} - ${d.end})`,
      start: d.date,
      extendedProps: d
    });
  });

  return events;
}

/* SAVE */
async function saveAvailability() {

  const player = document.getElementById("playerName").value;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) return;

  currentPlayer = player;
  localStorage.setItem("playerName", player);

  updatePlayerUI();

  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  calendar.removeAllEvents();
  const refreshed = await loadAll();
  refreshed.forEach(ev => calendar.addEvent(ev));

  renderPlayersForDay();
  closeAvailModal();
}

/* EDIT */
function openEditModal(event) {

  if (!currentPlayer) return;
  if (event.extendedProps.player !== currentPlayer) return;

  selectedEvent = event;

  document.getElementById("editModal").classList.remove("hidden");
}

/* DELETE */
async function deleteEvent() {
  await deleteDoc(doc(db, "availabilities", selectedEvent.id));
  selectedEvent.remove();
  renderPlayersForDay();
}

/* PLAYERS */
async function renderPlayersForDay() {

  const list = document.getElementById("playersList");
  list.innerHTML = "Loading...";

  const snapshot = await getDocs(collection(db, "availabilities"));

  let players = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.date === selectedDay) players.push(d);
  });

  players.sort((a,b) => a.start.localeCompare(b.start));

  list.innerHTML = "";

  players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player-card";

    div.innerHTML = `
      <span class="player-name">🟢 ${p.player}</span>
      <span>${p.start} → ${p.end}</span>
    `;

    list.appendChild(div);
  });
}

/* MODALS */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  selectedEvent = null;
}

/* BACKDROP USER */
window.closeUserBackdrop = (e) => {
  if (e.target.id === "userModal") {
    userModal.classList.add("hidden");
  }
};
