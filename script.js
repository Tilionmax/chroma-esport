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
let selectedCalendarEvent = null;

let currentPlayer = localStorage.getItem("playerName") || "";

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");
  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "dayGridMonth",
    events,
    locale: "fr",
    firstDay: 1,

    buttonText: {
      today: "Aujourd’hui",
      month: "Mois",
      week: "Semaine",
      day: "Jour",
      list: "Liste"
    },

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
      openAvailModal();
    },

    eventClick: (info) => {
      if (info.event.extendedProps.type === "event") {

      selectedCalendarEvent = info.event;

      document.getElementById("eventTitle").value =
        info.event.extendedProps.title;

      document.getElementById("eventDate").value =
        info.event.extendedProps.date;

      document.getElementById("eventStart").value =
        info.event.extendedProps.start;

      document.getElementById("eventEnd").value =
        info.event.extendedProps.end;

      document.getElementById("saveEventBtn").classList.add("hidden");

      document.getElementById("updateEventBtn").classList.remove("hidden");
      document.getElementById("deleteEventBtn").classList.remove("hidden"); 

      document.getElementById("eventModal").classList.remove("hidden");
      }
      
      else {
        openEditModal(info.event);
      }
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

  document.getElementById("createEventBtn").addEventListener("click", openEventModal);
  document.getElementById("saveEventBtn").addEventListener("click", saveEvent);
  document.getElementById("closeEventBtn").addEventListener("click", closeEventModal);

  document.getElementById("updateEventBtn").addEventListener("click", updateCalendarEvent);
  document.getElementById("deleteEventBtn").addEventListener("click", deleteCalendarEvent);

  updateUI();
  renderWeek();
  renderPlayersForDay();
  renderEventsForDay();

  if (!currentPlayer) openUsernameModal();
});

/* USER */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connecté en tant que : ${currentPlayer}` : "";
}

/* USERNAME */
function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
  document.getElementById("usernameInput").value = currentPlayer;
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

/* ajout fonction modifier event */
async function updateCalendarEvent() {

  if (!selectedCalendarEvent) return;

  await deleteDoc(
    doc(db, "events", selectedCalendarEvent.id)
  );

  await addDoc(collection(db, "events"), {

    title: document.getElementById("eventTitle").value,

    date: document.getElementById("eventDate").value,

    start: document.getElementById("eventStart").value,

    end: document.getElementById("eventEnd").value,

    participants:
      selectedCalendarEvent.extendedProps.participants || {}
  });

  refresh();
  closeEventModal();
}
/* ajout fonction supprimer event */
async function deleteCalendarEvent() {

  if (!selectedCalendarEvent) return;

  await deleteDoc(
    doc(db, "events", selectedCalendarEvent.id)
  );

  refresh();
  closeEventModal();
}

/* LOAD */
async function loadAll() {

  const snapA = await getDocs(collection(db, "availabilities"));
  const snapE = await getDocs(collection(db, "events"));

  let events = [];

  snapA.forEach(d => {
    const data = d.data();

    events.push({
      id: d.id,
      title: `${data.player} (${data.start}-${data.end})`,
      start: data.date,
      backgroundColor: "#3c9195",   // 👈 couleur joueurs
      borderColor: "#3c9195",
      textColor: "#ffffff",
      extendedProps: { ...data, type: "avail" }
    });
  });

  snapE.forEach(d => {
    const data = d.data();

    events.push({
      id: d.id,
      title: `🎮 ${data.title} (${data.start}-${data.end})`,
      start: data.date,
      backgroundColor: "#ffa83b",   // 👈 couleur events
      borderColor: "#ffa83b",
      textColor: "#000000",
      extendedProps: { ...data, type: "event", participants: data.participants || {} }
    });
  });

  return events;
}

/* SAVE AVAIL */
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

/* SAVE EVENT */
async function saveEvent() {

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

/* RSVP (présent / absent) */
async function setAttendance(status) {

  const snap = await getDocs(collection(db, "events"));

  let eventData = null;
  let id = null;

  snap.forEach(d => {
    if (d.id === selectedEvent.id) {
      eventData = d.data();
      id = d.id;
    }
  });

  if (!eventData) return;

  if (!eventData.participants) eventData.participants = {};

  eventData.participants[currentPlayer] = status;

  await deleteDoc(doc(db, "events", id));
  await addDoc(collection(db, "events"), eventData);

  refresh();
}

/* EDIT AVAIL */
function openEditModal(event) {

  selectedEvent = event;

  document.getElementById("editModal").classList.remove("hidden");
  document.getElementById("editInfo").textContent = event.title;

  document.getElementById("editStart").value = event.extendedProps.start;
  document.getElementById("editEnd").value = event.extendedProps.end;
}

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
}

/* REFRESH */
async function refresh() {
  calendar.removeAllEvents();
  const data = await loadAll();
  data.forEach(e => calendar.addEvent(e));

  renderPlayersForDay();
}

/* WEEK */
function renderWeek() {

  const today = new Date();
  const container = document.getElementById("weekDays");

  container.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "week-day";

    div.textContent = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "2-digit"
    });

    div.onclick = () => {
      selectedDay = iso;
      renderPlayersForDay();
      renderEventsForDay();
    };

    container.appendChild(div);
  }
}

/* PLAYERS */
async function renderPlayersForDay() {

  const list = document.getElementById("playersList");
  const snap = await getDocs(collection(db, "availabilities"));

  let arr = [];

  snap.forEach(d => {
    const data = d.data();
    if (data.date === selectedDay) arr.push(data);
  });

  list.innerHTML = arr.map(p => `
    <div class="player-card">
      <span>${p.player}</span>
      <span>${p.start} - ${p.end}</span>
    </div>
  `).join("");
}
/* events */
async function renderEventsForDay() {

  const list = document.getElementById("eventsList");
  const snap = await getDocs(collection(db, "events"));

  let arr = [];

  snap.forEach(d => {
    const data = d.data();

    if (data.date === selectedDay) {
      arr.push(data);
    }
  });

  list.innerHTML = arr.length
    ? arr.map(e => `
        <div class="player-card">
          <span>${e.title}</span>
          <span>${e.start} - ${e.end}</span>
        </div>
      `).join("")
    : "Aucun event";
}

/* MODALS */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function openEventModal() {

  selectedCalendarEvent = null;

  document.getElementById("eventTitle").value = "";
  document.getElementById("eventDate").value = "";
  document.getElementById("eventStart").value = "";
  document.getElementById("eventEnd").value = "";

  document.getElementById("saveEventBtn").classList.remove("hidden");

  document.getElementById("updateEventBtn").classList.add("hidden");
  document.getElementById("deleteEventBtn").classList.add("hidden");

  document.getElementById("eventModal").classList.remove("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
}
