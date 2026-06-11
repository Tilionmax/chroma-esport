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
  databaseURL: "https://chroma-esport-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.firebasestorage.app",
  messagingSenderId: "555749328122",
  appId: "1:555749328122:web:5765da259633ef047e3543"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* VARIABLES */
let calendar;
let selectedDate = null;
let selectedEvent = null;
let currentPlayer = "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: events,

    /* 🔥 INTERDIT DATES PASSÉES */
    validRange: {
      start: new Date().toISOString().split("T")[0]
    },

    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },

    /* 🩶 GRISER JOURS PASSÉS */
    dayCellClassNames: (arg) => {
      const today = new Date();
      today.setHours(0,0,0,0);

      const cellDate = new Date(arg.date);
      cellDate.setHours(0,0,0,0);

      if (cellDate < today) {
        return ["past-day"];
      }
      return [];
    },

    dateClick: (info) => {

      const today = new Date().toISOString().split("T")[0];

      if (info.dateStr < today) {
        alert("Impossible de choisir une date passée");
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
  closeEditModal();
}

/* DELETE */
async function deleteEvent() {

  await deleteDoc(doc(db, "availabilities", selectedEvent.id));

  selectedEvent.remove();

  closeEditModal();
}

/* REFRESH */
async function refreshCalendar() {
  calendar.removeAllEvents();

  const refreshed = await loadAll();
  refreshed.forEach(ev => calendar.addEvent(ev));
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

/* BACKDROP */
window.closeAddBackdrop = () => closeAvailModal();
window.closeEditBackdrop = () => closeEditModal();
