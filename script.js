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
let selectedFirebaseEvent = null;

let currentPlayer = localStorage.getItem("playerName") || "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "dayGridMonth",
    events,

    dateClick: (info) => {

      if (!currentPlayer) return openUsernameModal();

      selectedDate = info.dateStr;
      selectedDay = info.dateStr;

      renderWeek();
      renderPlayersForDay();

      openChoiceModal(); // 🔥 IMPORTANT
    },

    eventClick: (info) => {

      const type = info.event.extendedProps.type;

      if (type === "event") {
        openEventInfo(info.event);
      } else {
        openEditModal(info.event);
      }
    }
  });

  calendar.render();

  /* BUTTONS */
  document.getElementById("saveAvailBtn").onclick = saveAvailability;
  document.getElementById("saveEventBtn").onclick = saveEvent;

  document.getElementById("choiceAvailBtn").onclick = () => {
    closeChoiceModal();
    openAvailModal();
  };

  document.getElementById("choiceEventBtn").onclick = () => {
    closeChoiceModal();
    openEventModal();
  };

  document.getElementById("saveUsernameBtn").onclick = saveUsername;
  document.getElementById("changePlayerBtn").onclick = openUsernameModal;

  renderWeek();
  renderPlayersForDay();
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
      title: `📌 ${x.title} (${x.type})`,
      start: x.date,
      extendedProps: { ...x, type: "event" }
    });
  });

  return events;
}

/* SAVE AVAILABILITY */
async function saveAvailability() {

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedDate,
    start: startHour.value,
    end: endHour.value
  });

  refresh();
  closeAvailModal();
}

/* SAVE EVENT */
async function saveEvent() {

  await addDoc(collection(db, "events"), {
    title: eventTitle.value,
    type: "scrim",
    date: selectedDate,
    start: eventStart.value,
    end: eventEnd.value,
    attendees: {}
  });

  refresh();
  closeEventModal();
}

/* RSVP */
async function toggleRSVP(status) {

  const eventId = selectedFirebaseEvent.id;

  const snap = await getDocs(collection(db, "events"));

  let data;
  snap.forEach(d => {
    if (d.id === eventId) data = d.data();
  });

  data.attendees[currentPlayer] = status;

  await deleteDoc(doc(db, "events", eventId));
  await addDoc(collection(db, "events"), data);

  refresh();
}

/* EVENT INFO */
function openEventInfo(event) {

  selectedFirebaseEvent = event;

  const a = event.extendedProps.attendees || {};

  eventInfoBox.innerHTML = `
    <div><b>${event.title}</b></div>
    <button onclick="window.__yes()">🟢 Yes</button>
    <button onclick="window.__no()">🔴 No</button>
    <div>
      ${Object.entries(a).map(([p,s]) => `<div>${p}: ${s}</div>`).join("")}
    </div>
  `;

  window.__yes = () => toggleRSVP(true);
  window.__no = () => toggleRSVP(false);
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));
}

/* MODALS */
function openChoiceModal(){ choiceModal.classList.remove("hidden"); }
function closeChoiceModal(){ choiceModal.classList.add("hidden"); }

function openEventModal(){ eventModal.classList.remove("hidden"); }
function closeEventModal(){ eventModal.classList.add("hidden"); }

function openAvailModal(){ availModal.classList.remove("hidden"); }
function closeAvailModal(){ availModal.classList.add("hidden"); }

function openUsernameModal(){ usernameModal.classList.remove("hidden"); }

function saveUsername(){
  currentPlayer = usernameInput.value;
  localStorage.setItem("playerName", currentPlayer);
  playerText.textContent = currentPlayer;
  usernameModal.classList.add("hidden");
}

/* WEEK (RESTE INTACT) */
function renderWeek() {

  const today = new Date();
  const container = document.getElementById("weekDays");

  container.innerHTML = "";

  const start = new Date(today);
  const end = new Date(today);
  end.setDate(end.getDate() + 6);

  weekRange.textContent =
    `Week ${start.toLocaleDateString()} → ${end.toLocaleDateString()}`;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "week-day";
    div.textContent = iso;

    container.appendChild(div);
  }
}

/* PLAYERS */
async function renderPlayersForDay() {

  const snap = await getDocs(collection(db, "availabilities"));

  let arr = [];

  snap.forEach(d => {
    if (d.data().date === selectedDay) arr.push(d.data());
  });

  playersList.innerHTML = arr.map(p =>
    `<div>${p.player} ${p.start}-${p.end}</div>`
  ).join("");
}
