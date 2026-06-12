import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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

      if (!currentPlayer) {
        openUsernameModal();
        return;
      }

      selectedDate = info.dateStr;
      openAvailModal();
    },

    eventClick: (info) => {

      const type = info.event.extendedProps.type;

      if (type === "event") {
        selectedEventDoc = info.event;
        openEventDetail(info.event);
      }

      if (type === "availability") {
        openEditModal(info.event);
      }
    }
  });

  calendar.render();

  document.getElementById("saveEventBtn").addEventListener("click", saveEvent);
  document.getElementById("btnYes").addEventListener("click", () => updateAttendance(true));
  document.getElementById("btnNo").addEventListener("click", () => updateAttendance(false));

  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
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

    const colors = {
      scrim: "#ffb703",
      match: "#fb5607",
      training: "#00d3dd"
    };

    events.push({
      id: d.id,
      title: `[${x.type}] ${x.title}`,
      start: x.date,
      color: colors[x.type] || "#00d3dd",
      extendedProps: { ...x, type: "event" }
    });
  });

  return events;
}

/* SAVE EVENT */
async function saveEvent() {

  await addDoc(collection(db, "events"), {
    title: document.getElementById("eventTitle").value,
    type: document.getElementById("eventType").value,
    date: selectedDate,
    start: document.getElementById("eventStart").value,
    end: document.getElementById("eventEnd").value,
    attendees: {}
  });

  refresh();
}

/* RSVP */
async function updateAttendance(status) {

  const id = selectedEventDoc.id;

  await updateDoc(doc(db, "events", id), {
    [`attendees.${currentPlayer}`]: status
  });

  refresh();
}

/* SAVE AVAILABILITY (inchangé logique) */
async function saveAvailability() {

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedDate,
    start: document.getElementById("startHour").value,
    end: document.getElementById("endHour").value
  });

  refresh();
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));
}

/* MODALS (minimal safe) */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function openEventDetail(event) {
  document.getElementById("eventDetailModal").classList.remove("hidden");
  document.getElementById("eventDetailTitle").textContent = event.title;

  const a = event.extendedProps.attendees || {};
  document.getElementById("attendeesList").innerHTML =
    Object.entries(a).map(([k,v]) => `<div>${k}: ${v ? "🟢" : "🔴"}</div>`).join("");
}

function openEditModal(event) {
  document.getElementById("editModal").classList.remove("hidden");
}

function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
}
