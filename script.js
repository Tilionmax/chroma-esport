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
  apiKey: "AIzaSyBJX1M5RBfbQuylsLKNsaKflTD0l19l6lI",
  authDomain: "chroma-esport-eva.firebaseapp.com",
  projectId: "chroma-esport-eva",
  storageBucket: "chroma-esport-eva.firebasestorage.app",
  messagingSenderId: "789903307423",
  appId: "1:789903307423:web:710c9041ad65603d03a8aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* STATE */
let calendar;
let selectedDate = null;
let selectedDay = new Date().toISOString().split("T")[0];
let selectedEvent = null;

let currentPlayer = localStorage.getItem("playerName") || "";

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

      if (!currentPlayer) {
        openUsernameModal();
        return;
      }

      selectedDate = info.dateStr;
      selectedDay = info.dateStr;

      renderWeek();
      renderPlayersForDay();

      openChoiceModal(); // 🔥 MODIF ICI
    },

    eventClick: (info) => openEditModal(info.event)
  });

  calendar.render();

  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);
  document.getElementById("updateBtn").addEventListener("click", updateEvent);
  document.getElementById("deleteBtn").addEventListener("click", deleteEvent);
  document.getElementById("closeEditBtn").addEventListener("click", closeEditModal);

  document.getElementById("changePlayerBtn").addEventListener("click", openUsernameModal);
  document.getElementById("saveUsernameBtn").addEventListener("click", saveUsername);
  document.getElementById("closeUsernameBtn").addEventListener("click", closeUsernameModal);

  /* NEW */
  document.getElementById("choiceAvailBtn").addEventListener("click", () => {
    closeChoiceModal();
    openAvailModal();
  });

  document.getElementById("choiceEventBtn").addEventListener("click", () => {
    closeChoiceModal();
    openEventModal();
  });

  document.getElementById("saveEventBtn").addEventListener("click", saveEvent);

  updateUI();
  renderWeek();
  renderPlayersForDay();
});

/* USER */
function updateUI() {
  const playerText = document.getElementById("playerText");

  if (playerText) {
    playerText.textContent =
      currentPlayer ? `Connected as: ${currentPlayer}` : "";
  }
}

/* USERNAME */
function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
  document.getElementById("usernameInput").value = currentPlayer;
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}

function saveUsername() {

  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return;

  currentPlayer = name;
  localStorage.setItem("playerName", name);

  updateUI();
  closeUsernameModal();
}

/* LOAD */
async function loadAll() {

  const availSnap = await getDocs(collection(db, "availabilities"));
  const eventSnap = await getDocs(collection(db, "events"));

  let events = [];

  /* AVAILABILITIES */
  availSnap.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `${d.player} (${d.start}-${d.end})`,
      start: d.date,
      color: "#010c2c", // option visuelle
      extendedProps: d
    });
  });

  /* EVENTS */
  eventSnap.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `📌 ${d.title} (${d.start}-${d.end})`,
      start: d.date,
      color: "#00d3dd", // couleur event
      extendedProps: d
    });
  });

  return events;
}

/* SAVE AVAILABILITY */
async function saveAvailability() {

  const player = currentPlayer;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) return;

  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  refresh();
  closeAvailModal();
}

/* UPDATE */
async function updateEvent() {

  await deleteDoc(doc(db, "availabilities", selectedEvent.id));

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedEvent.startStr,
    start: document.getElementById("editStart").value,
    end: document.getElementById("editEnd").value
  });

  refresh();
  closeEditModal();
}

/* DELETE */
async function deleteEvent() {

  await deleteDoc(doc(db, "availabilities", selectedEvent.id));

  refresh();
  closeEditModal();
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));

  renderPlayersForDay();
}

/* WEEK */
function renderWeek() {

  const today = new Date();
  const container = document.getElementById("weekDays");

  container.innerHTML = "";

  for (let i = 0; i < 7; i++) {

    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "week-day";

    if (iso === selectedDay) div.classList.add("active");

    div.textContent = d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit"
    });

    div.onclick = () => {
      selectedDay = iso;
      renderWeek();
      renderPlayersForDay();
    };

    container.appendChild(div);
  }
}

/* PLAYERS */
async function renderPlayersForDay() {

  const list = document.getElementById("playersList");
  list.innerHTML = "";

  const snapshot = await getDocs(collection(db, "availabilities"));

  let arr = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.date === selectedDay) arr.push(d);
  });

  arr.sort((a,b) => a.start.localeCompare(b.start));

  list.innerHTML = arr.map(p =>
    `<div class="player-card">
      <span class="player-name">${p.player}</span>
      <span>${p.start} - ${p.end}</span>
    </div>`
  ).join("");
}

/* MODALS */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
  document.getElementById("modalPlayerName").textContent =
    currentPlayer || "No username";
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function openEditModal(event) {

  if (event.extendedProps.player !== currentPlayer) return;

  selectedEvent = event;

  document.getElementById("editInfo").textContent =
    `${event.extendedProps.player} ${event.extendedProps.start}-${event.extendedProps.end}`;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  selectedEvent = null;
}

/* 🔥 NEW MODALS */
function openChoiceModal() {
  document.getElementById("choiceModal").classList.remove("hidden");
}

function closeChoiceModal() {
  document.getElementById("choiceModal").classList.add("hidden");
}

function openEventModal() {
  document.getElementById("eventModal").classList.remove("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

/* SAVE EVENT */
async function saveEvent() {

  const title = document.getElementById("eventTitle").value;
  const start = document.getElementById("eventStart").value;
  const end = document.getElementById("eventEnd").value;

  if (!title || !start || !end) return;

  await addDoc(collection(db, "events"), {
    title,
    date: selectedDate,
    start,
    end
  });

  closeEventModal();
  refresh();
}
window.closeChoiceModal = closeChoiceModal;
window.openChoiceModal = openChoiceModal;
window.openEventModal = openEventModal;
window.closeEventModal = closeEventModal;
