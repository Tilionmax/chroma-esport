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

      selectedDate = info.dateStr;
      openAvailModal();
    },

    eventClick: (info) => {
      openEditModal(info.event);
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
});

/* LOAD */
async function loadAll() {
  const snap = await getDocs(collection(db, "availabilities"));

  let events = [];

  snap.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `${d.player} (${d.start}-${d.end})`,
      start: d.date,
      extendedProps: {
        player: d.player
      }
    });
  });

  return events;
}

/* SAVE AVAILABILITY */
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

  closeAvailModal();
  refresh();
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

  closeEditModal();
  refresh();
}

/* DELETE */
async function deleteEvent() {
  await deleteDoc(doc(db, "availabilities", selectedEvent.id));
  closeEditModal();
  refresh();
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));
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

/* AVAILABILITY MODAL */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
  document.getElementById("modalPlayerName").textContent = currentPlayer;
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

/* EDIT MODAL */
function openEditModal(event) {

  selectedEvent = event;

  document.getElementById("editInfo").textContent = event.title;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}
