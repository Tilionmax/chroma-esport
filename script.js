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

      if (!currentPlayer) {
        openUsernameModal();
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      if (info.dateStr < today) return;

      selectedDate = info.dateStr;
      selectedDay = info.dateStr;

      renderWeek();
      renderPlayersForDay();
      openAvailModal();
    },

    eventClick: (info) => {

      const type = info.event.extendedProps.type;

      if (type === "availability") {
        openEditModal(info.event);
      }
    }
  });

  calendar.render();

  /* BUTTONS */
  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);

  document.getElementById("updateBtn").addEventListener("click", updateEvent);
  document.getElementById("deleteBtn").addEventListener("click", deleteEvent);
  document.getElementById("closeEditBtn").addEventListener("click", closeEditModal);

  document.getElementById("changePlayerBtn").addEventListener("click", openUsernameModal);
  document.getElementById("saveUsernameBtn").addEventListener("click", saveUsername);
  document.getElementById("closeUsernameBtn").addEventListener("click", closeUsernameModal);

  updateUI();
  renderWeek();
  renderPlayersForDay();

  /* FIRST VISIT */
  if (!currentPlayer) {
    openUsernameModal();
  }
});

/* LOAD */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `${d.player} (${d.start}-${d.end})`,
      start: d.date,
      extendedProps: {
        ...d,
        type: "availability"
      }
    });
  });

  return events;
}

/* SAVE */
async function saveAvailability() {

  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!start || !end) return;

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedDate,
    start,
    end
  });

  refresh();
  closeAvailModal();
}

/* EDIT */
function openEditModal(event) {

  selectedEvent = event;

  document.getElementById("editInfo").textContent =
    `${event.extendedProps.player} ${event.extendedProps.start}-${event.extendedProps.end}`;

  document.getElementById("editStart").value = event.extendedProps.start;
  document.getElementById("editEnd").value = event.extendedProps.end;

  document.getElementById("editModal").classList.remove("hidden");
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
  renderWeek();
}

/* USER */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connected as: ${currentPlayer}` : "";
}

/* USERNAME */
function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
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

/* WEEK + PLAYERS (inchangés) */
function renderWeek() {
  const today = new Date();
  const container = document.getElementById("weekDays");
  container.innerHTML = "";
}

async function renderPlayersForDay() {
  const list = document.getElementById("playersList");
  list.innerHTML = "";
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

/* GLOBAL */
window.closeAvailModal = closeAvailModal;
window.closeEditModal = closeEditModal;
window.openEditModal = openEditModal;
window.openAvailModal = openAvailModal;
