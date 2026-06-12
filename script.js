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
let selectedEventDoc = null;

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

      openChoiceModal();
    },

    eventClick: (info) => openEventDetail(info.event)
  });

  calendar.render();

  /* BUTTONS */
  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);

  document.getElementById("choiceAvailBtn").addEventListener("click", () => {
    closeChoiceModal();
    openAvailModal();
  });

  document.getElementById("choiceEventBtn").addEventListener("click", () => {
    closeChoiceModal();
    openEventModal();
  });

  document.getElementById("saveEventBtn").addEventListener("click", saveEvent);

  document.getElementById("btnYes").addEventListener("click", () => updateAttendance(true));
  document.getElementById("btnNo").addEventListener("click", () => updateAttendance(false));

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
}

function saveUsername() {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return;

  currentPlayer = name;
  localStorage.setItem("playerName", name);

  updateUI();
  closeUsernameModal();
}

/* LOAD ALL */
async function loadAll() {

  const availSnap = await getDocs(collection(db, "availabilities"));
  const eventSnap = await getDocs(collection(db, "events"));

  let events = [];

  availSnap.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `${d.player} (${d.start}-${d.end})`,
      start: d.date,
      color: "#010c2c",
      extendedProps: d
    });
  });

  eventSnap.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `📌 ${d.title} (${d.start}-${d.end})`,
      start: d.date,
      color: "#00d3dd",
      extendedProps: d
    });
  });

  return events;
}

/* AVAILABILITY */
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

/* EVENT */
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

/* EVENT DETAIL */
function openEventDetail(event) {

  selectedEventDoc = event;

  document.getElementById("eventDetailTitle").textContent = event.title;
  document.getElementById("eventDetailInfo").textContent = event.startStr;

  renderAttendees(event);

  document.getElementById("eventDetailModal").classList.remove("hidden");
}

function closeEventDetail() {
  document.getElementById("eventDetailModal").classList.add("hidden");
}

/* ATTENDEES */
function renderAttendees(event) {

  const attendees = event.extendedProps.attendees || {};

  document.getElementById("attendeesList").innerHTML =
    Object.entries(attendees).map(([name, status]) =>
      `<div>${name} : ${status ? "🟢 available" : "🔴 not available"}</div>`
    ).join("") || "No responses yet";
}

/* RSVP */
async function updateAttendance(status) {

  const eventId = selectedEventDoc.id;

  const snap = await getDocs(collection(db, "events"));

  let data = null;

  snap.forEach(d => {
    if (d.id === eventId) data = d.data();
  });

  const attendees = data.attendees || {};
  attendees[currentPlayer] = status;

  await deleteDoc(doc(db, "events", eventId));

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
  renderPlayersForDay();
}

/* WEEK + PLAYERS (inchangé simplifié) */
function renderWeek() {}
async function renderPlayersForDay() {}

/* MODALS */
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
