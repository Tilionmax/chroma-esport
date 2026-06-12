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

    dateClick: (info) => {

      if (!currentPlayer) {
        openUsernameModal();
        return;
      }

      selectedDate = info.dateStr;
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

  /* BUTTONS */
  document.getElementById("saveAvailBtn").onclick = saveAvailability;
  document.getElementById("closeAvailBtn").onclick = closeAvailModal;

  document.getElementById("updateBtn").onclick = updateEvent;
  document.getElementById("deleteBtn").onclick = deleteEvent;
  document.getElementById("closeEditBtn").onclick = closeEditModal;

  document.getElementById("saveEventBtn").onclick = saveEvent;

  document.getElementById("btnYes").onclick = () => updateAttendance(true);
  document.getElementById("btnNo").onclick = () => updateAttendance(false);

  document.getElementById("saveUsernameBtn").onclick = saveUsername;
  document.getElementById("closeUsernameBtn").onclick = closeUsernameModal;

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

    let icon = "📌";
    if (x.type === "scrim") icon = "🔥";
    if (x.type === "match") icon = "🏆";
    if (x.type === "training") icon = "🎯";

    events.push({
      id: d.id,
      title: `${icon} ${x.title} (${x.start}-${x.end})`,
      start: x.date,
      extendedProps: { ...x, type: "event", ...x }
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
  const type = document.getElementById("eventType").value;
  const start = document.getElementById("eventStart").value;
  const end = document.getElementById("eventEnd").value;

  if (!title || !start || !end) return;

  await addDoc(collection(db, "events"), {
    title,
    type,
    date: selectedDate,
    start,
    end,
    attendees: {}
  });

  closeEventModal();
  refresh();
}

/* EVENT DETAIL */
function openEventDetail(event) {

  selectedEvent = event;

  document.getElementById("eventDetailTitle").textContent = event.title;

  const attendees = event.extendedProps.attendees || {};

  document.getElementById("attendeesList").innerHTML =
    Object.entries(attendees).map(([name, val]) =>
      `<div>${name} : ${val ? "🟢" : "🔴"}</div>`
    ).join("") || "No responses";

  document.getElementById("eventDetailModal").classList.remove("hidden");
}

/* RSVP */
async function updateAttendance(status) {

  const id = selectedEvent.id;

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

/* EDIT AVAILABILITY */
function openEditModal(event) {

  selectedEvent = event;

  document.getElementById("editInfo").textContent =
    `${event.extendedProps.player} ${event.extendedProps.start}-${event.extendedProps.end}`;

  document.getElementById("editModal").classList.remove("hidden");
}

/* UPDATE / DELETE */
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
}

/* UI */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connected as: ${currentPlayer}` : "";
}

/* MODALS */
function openChoiceModal() {
  document.getElementById("choiceModal").classList.remove("hidden");
}

function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

function closeEventDetail() {
  document.getElementById("eventDetailModal").classList.add("hidden");
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}
