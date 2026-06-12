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
  storageBucket: "chroma-esport-eva.appspot.com",
  messagingSenderId: "789903307423",
  appId: "1:789903307423:web:710c9041ad65603d03a8aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* STATE */
let calendar;
let selectedDate = null;
let selectedEventDoc = null;

let currentPlayer = localStorage.getItem("playerName") || "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");
  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "dayGridMonth",
    events,

    dateClick: (info) => {
      selectedDate = info.dateStr;

      if (!currentPlayer) {
        openUsernameModal();
        return;
      }

      openChoiceModal();
    },

    eventClick: (info) => {

      const type = info.event.extendedProps.type;

      if (type === "event") {
        openEventDetail(info.event);
      } else {
        openEditModal(info.event);
      }
    }
  });

  calendar.render();

  /* BUTTONS SAFE */
  setTimeout(() => {

    document.getElementById("saveAvailBtn").onclick = saveAvailability;
    document.getElementById("closeAvailBtn").onclick = closeAvailModal;

    document.getElementById("choiceAvailBtn").onclick = () => {
      closeChoiceModal();
      openAvailModal();
    };

    document.getElementById("choiceEventBtn").onclick = () => {
      closeChoiceModal();
      openEventModal();
    };

    document.getElementById("saveEventBtn").onclick = saveEvent;

    document.getElementById("btnYes").onclick = () => updateAttendance(true);
    document.getElementById("btnNo").onclick = () => updateAttendance(false);

    document.getElementById("saveUsernameBtn").onclick = saveUsername;
    document.getElementById("closeUsernameBtn").onclick = closeUsernameModal;

  }, 200);

  updateUI();
});

/* LOAD */
async function loadAll() {

  const availSnap = await getDocs(collection(db, "availabilities"));
  const eventSnap = await getDocs(collection(db, "events"));

  let events = [];

  availSnap.forEach(d => {
    const x = d.data();

    events.push({
      id: d.id,
      title: `${x.player} (${x.start}-${x.end})`,
      start: x.date,
      extendedProps: { ...x, type: "availability" }
    });
  });

  eventSnap.forEach(d => {
    const x = d.data();

    events.push({
      id: d.id,
      title: `📌 ${x.title}`,
      start: x.date,
      extendedProps: { ...x, type: "event" }
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
    end,
    attendees: {}
  });

  closeEventModal();
  refresh();
}

/* RSVP */
async function updateAttendance(status) {

  const id = selectedEventDoc.id;

  const snap = await getDocs(collection(db, "events"));

  let data;

  snap.forEach(d => {
    if (d.id === id) data = d.data();
  });

  const attendees = data.attendees || {};
  attendees[currentPlayer] = status;

  await deleteDoc(doc(db, "events", id));

  await addDoc(collection(db, "events"), {
    ...data,
    attendees
  });

  closeEventDetail();
  refresh();
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));
}

/* UI */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connected as ${currentPlayer}` : "";
}

/* MODALS */
function openChoiceModal() {
  document.getElementById("choiceModal").classList.remove("hidden");
}
function closeChoiceModal() {
  document.getElementById("choiceModal").classList.add("hidden");
}

function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}
function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function openEventModal() {
  document.getElementById("eventModal").classList.remove("hidden");
}
function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

function openEventDetail(event) {
  selectedEventDoc = event;

  document.getElementById("eventDetailTitle").textContent = event.title;
  document.getElementById("eventDetailModal").classList.remove("hidden");
}

function closeEventDetail() {
  document.getElementById("eventDetailModal").classList.add("hidden");
}

function openEditModal(event) {
  selectedEventDoc = event;

  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}

function saveUsername() {
  const name = document.getElementById("usernameInput").value;
  if (!name) return;

  currentPlayer = name;
  localStorage.setItem("playerName", name);

  updateUI();
  closeUsernameModal();
}

/* GLOBAL EXPORT (IMPORTANT MODULE FIX) */
window.closeChoiceModal = closeChoiceModal;
window.closeEventDetail = closeEventDetail;
window.closeAvailModal = closeAvailModal;
window.closeEditModal = closeEditModal;
window.closeUsernameModal = closeUsernameModal;
window.openChoiceModal = openChoiceModal;
