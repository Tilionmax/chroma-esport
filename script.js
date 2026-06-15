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
let currentPlayer = localStorage.getItem("playerName") || "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "dayGridMonth",
    events,
    locale: "fr",

    dateClick: (info) => {
      if (!currentPlayer) return openUsernameModal();

      selectedDate = info.dateStr;
      openAvailModal();
    },

    eventClick: (info) => {
      selectedEvent = info.event;
      renderParticipants(info.event);
    }
  });

  calendar.render();

  /* BUTTONS */
  document.getElementById("saveAvailBtn").onclick = saveAvailability;
  document.getElementById("saveEventBtn").onclick = saveEvent;

  document.getElementById("createEventBtn").onclick = openEventModal;

  document.getElementById("attendBtn").onclick = () => setAttendance(true);
  document.getElementById("absentBtn").onclick = () => setAttendance(false);

  updateUI();
  refreshSidebar();
});

/* LOAD */
async function loadAll() {

  const snap = await getDocs(collection(db, "events"));

  let arr = [];

  snap.forEach(d => {
    const data = d.data();

    arr.push({
      id: d.id,
      title: `🎮 ${data.title}`,
      start: data.date,
      extendedProps: data
    });
  });

  return arr;
}

/* CREATE EVENT (ONLY Tikafx) */
async function saveEvent() {

  if (currentPlayer !== "Tikafx") {
    alert("Seul Tikafx peut créer un event");
    return;
  }

  await addDoc(collection(db, "events"), {
    title: document.getElementById("eventTitle").value,
    date: document.getElementById("eventDate").value,
    start: document.getElementById("eventStart").value,
    end: document.getElementById("eventEnd").value,
    participants: {}
  });

  refresh();
  closeEventModal();
}

/* RSVP FIX */
async function setAttendance(status) {

  const snap = await getDocs(collection(db, "events"));

  let targetId = null;
  let data = null;

  snap.forEach(d => {
    if (d.id === selectedEvent.id) {
      targetId = d.id;
      data = d.data();
    }
  });

  if (!data.participants) data.participants = {};

  data.participants[currentPlayer] = status;

  await updateDoc(doc(db, "events", targetId), data);

  renderParticipants(selectedEvent);
}

/* PARTICIPANTS UI */
function renderParticipants(event) {

  const box = document.getElementById("participantsList");

  const p = event.extendedProps.participants || {};

  box.innerHTML = Object.keys(p).map(name =>
    `<div>${name} : ${p[name] ? "Présent" : "Absent"}</div>`
  ).join("");
}

/* AVAIL */
async function saveAvailability() {

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedDate,
    start: document.getElementById("startHour").value,
    end: document.getElementById("endHour").value
  });

  refresh();
  closeAvailModal();
}

/* UI */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connecté : ${currentPlayer}` : "";
}

/* REFRESH */
async function refresh() {
  const events = await loadAll();

  calendar.removeAllEvents();
  events.forEach(e => calendar.addEvent(e));

  refreshSidebar();
}

/* SIDEBAR */
async function refreshSidebar() {

  const snap = await getDocs(collection(db, "events"));

  document.getElementById("eventList").innerHTML =
    snap.docs.map(d => `<div>${d.data().title}</div>`).join("");
}

/* MODALS */
function openEventModal() {
  document.getElementById("eventModal").classList.remove("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}
