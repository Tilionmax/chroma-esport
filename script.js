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
  apiKey: "TON_API_KEY",
  authDomain: "chroma-esport.firebaseapp.com",
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.appspot.com",
  messagingSenderId: "TON_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* VARIABLES */
let calendar;
let selectedDate = null;
let selectedDay = null;
let selectedEvent = null;
let currentPlayer = "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: events,

    validRange: {
      start: new Date().toISOString().split("T")[0]
    },

    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    dayCellClassNames: (arg) => {

  const classes = [];

  const today = new Date();
  today.setHours(0,0,0,0);

  const cellDate = new Date(arg.date);
  cellDate.setHours(0,0,0,0);

  if (cellDate < today) {
    classes.push("past-day");
  }

  if (selectedDay === arg.dateStr) {
    classes.push("selected-day");
  }

  return classes;
},

    dateClick: (info) => {

      const today = new Date().toISOString().split("T")[0];

      if (info.dateStr < today) {
        alert("Impossible de choisir une date passée");
        return;
      }

      selectedDate = info.dateStr;
selectedDay = info.dateStr;

calendar.render();

openAvailModal();
renderPlayersForDay();
    },

    eventClick: (info) => {
      openEditModal(info.event);
    }
  });

  calendar.render();

  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);

  document.getElementById("updateBtn").addEventListener("click", updateEvent);
  document.getElementById("deleteBtn").addEventListener("click", deleteEvent);
});

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
      extendedProps: {
        player: d.player,
        start: d.start,
        end: d.end
      }
    });
  });

  return events;
}

/* SAVE */
async function saveAvailability() {
  const player = document.getElementById("playerName").value;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) {
    alert("Remplis tout");
    return;
  }

  currentPlayer = player;

  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  refreshCalendar();
  renderPlayersForDay();
  closeAvailModal();
}

/* EDIT */
function openEditModal(event) {

  if (!currentPlayer) {
    alert("Entre ton pseudo");
    return;
  }

  if (event.extendedProps.player !== currentPlayer) {
    alert("Tu ne peux modifier que tes disponibilités");
    return;
  }

  selectedEvent = event;

  document.getElementById("editInfo").innerText =
    `${event.extendedProps.player} • ${event.extendedProps.start} → ${event.extendedProps.end}`;

  document.getElementById("editModal").classList.remove("hidden");
}

/* UPDATE */
async function updateEvent() {

  const start = document.getElementById("editStart").value;
  const end = document.getElementById("editEnd").value;

  await deleteDoc(doc(db, "availabilities", selectedEvent.id));

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedEvent.startStr,
    start,
    end
  });

  refreshCalendar();
  renderPlayersForDay();
  closeEditModal();
}

/* DELETE */
async function deleteEvent() {

  await deleteDoc(doc(db, "availabilities", selectedEvent.id));

  selectedEvent.remove();

  renderPlayersForDay();
  closeEditModal();
}

/* REFRESH */
async function refreshCalendar() {
  calendar.removeAllEvents();

  const refreshed = await loadAll();
  refreshed.forEach(ev => calendar.addEvent(ev));
}

/* LISTE JOUEURS */
async function renderPlayersForDay() {

  const list = document.getElementById("playersList");
  list.innerHTML = "Chargement...";

  const snapshot = await getDocs(collection(db, "availabilities"));

  let players = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    if (d.date === selectedDay) {
      players.push(d);
    }
  });

  if (players.length === 0) {
    list.innerHTML = "Aucun joueur disponible";
    return;
  }

  players.sort((a, b) => a.start.localeCompare(b.start));

  list.innerHTML = "";

  players.forEach(p => {
    const div = document.createElement("div");
    div.className = "player-card";

    div.innerHTML = `
      <span class="player-name">🟢 ${p.player}</span>
      <span class="player-time">${p.start} → ${p.end}</span>
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

window.closeAddBackdrop = () => closeAvailModal();
window.closeEditBackdrop = () => closeEditModal();
