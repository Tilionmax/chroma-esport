import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

let calendar;
let selectedDate = null;
let currentPlayer = localStorage.getItem("playerName") || "";
let selectedEvent = null;

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
      openChoiceModal();
    },

    eventClick: (info) => {

      if (info.event.extendedProps.type === "event") {
        openEventDetail(info.event);
      } else {
        openEditModal(info.event);
      }
    }
  });

  calendar.render();

  document.getElementById("choiceAvailBtn").onclick = () => {
    closeChoiceModal();
    openAvailModal();
  };

  document.getElementById("choiceEventBtn").onclick = () => {
    closeChoiceModal();
    openEventModal();
  };

  document.getElementById("closeChoiceBtn").onclick = closeChoiceModal;

  document.getElementById("saveEventBtn").onclick = saveEvent;
  document.getElementById("closeEventBtn").onclick = closeEventModal;

  document.getElementById("saveAvailBtn").onclick = saveAvailability;
  document.getElementById("closeAvailBtn").onclick = closeAvailModal;

  document.getElementById("saveUsernameBtn").onclick = saveUsername;
  document.getElementById("closeUsernameBtn").onclick = closeUsernameModal;

  updateUI();
  renderWeek();
  renderPlayersForDay();
});

/* LOAD */
async function loadAll() {

  const events = [];

  const availSnap = await getDocs(collection(db, "availabilities"));
  const eventSnap = await getDocs(collection(db, "events"));

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
      title: `${x.type} ${x.title}`,
      start: x.date,
      color: "#ff7b00",
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
    type: eventType.value,
    title: eventTitle.value,
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

  const event = selectedEvent;

  const data = event.extendedProps;
  data.attendees[currentPlayer] = status;

  await deleteDoc(doc(db, "events", event.id));
  await addDoc(collection(db, "events"), data);

  refresh();
}

/* EVENTS CLICK */
function openEventDetail(event) {
  selectedEvent = event;
  alert(`${event.title}`);
}

/* UI */
function openChoiceModal() {
  choiceModal.classList.remove("hidden");
}

function closeChoiceModal() {
  choiceModal.classList.add("hidden");
}

function openEventModal() {
  eventModal.classList.remove("hidden");
}

function closeEventModal() {
  eventModal.classList.add("hidden");
}

function openAvailModal() {
  availModal.classList.remove("hidden");
}

function closeAvailModal() {
  availModal.classList.add("hidden");
}

function openUsernameModal() {
  usernameModal.classList.remove("hidden");
}

function closeUsernameModal() {
  usernameModal.classList.add("hidden");
}

function saveUsername() {
  currentPlayer = usernameInput.value;
  localStorage.setItem("playerName", currentPlayer);
  updateUI();
}

function updateUI() {
  playerText.textContent = currentPlayer ? `Connected as: ${currentPlayer}` : "";
}

/* PLACEHOLDER */
function renderWeek() {}
function renderPlayersForDay() {}
function refresh() {
  location.reload();
}
