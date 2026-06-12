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
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.appspot.com",
  messagingSenderId: "555749328122",
  appId: "1:555749328122:web:5765da259633ef047e3543"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* STATE */
let calendar;
let selectedDate = null;
let selectedDay = new Date().toISOString().split("T")[0];
let selectedEvent = null;

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
  openAvailModal();
},

    eventClick: (info) => openEditModal(info.event)
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

  updateUI();
renderWeek();
renderPlayersForDay();

/* PREMIERE VISITE */
if (!currentPlayer) {
  openUsernameModal();

  // cache le bouton fermer
  document.getElementById("closeUsernameBtn").style.display = "none";
}
});

/* USER */
function updateUI() {

  const playerText = document.getElementById("playerText");

  if (playerText) {
    playerText.textContent =
      currentPlayer ? `Connected as: ${currentPlayer}` : "";
  }

}

/* USERNAME MODAL */
function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
  document.getElementById("usernameInput").value = currentPlayer;
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}

function saveUsername() {

  const name = document.getElementById("usernameInput").value.trim();

  if (!name) {
    alert("Please enter your Discord username");
    return;
  }

  currentPlayer = name;
  localStorage.setItem("playerName", name);

  updateUI();

  // réaffiche le bouton fermer
  document.getElementById("closeUsernameBtn").style.display = "inline-block";

  closeUsernameModal();
}

/* LOAD */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `${d.player} (${d.start}-${d.end})`,
      start: d.date,
      extendedProps: d
    });
  });

  return events;
}

/* SAVE */
async function saveAvailability() {

  const player = currentPlayer;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) return;


  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  refresh();
  closeAvailModal();
}

/* EDIT */
function openEditModal(event) {

  if (event.extendedProps.player !== currentPlayer) return;

  selectedEvent = event;

  document.getElementById("editInfo").textContent =
    `${event.extendedProps.player} ${event.extendedProps.start}-${event.extendedProps.end}`;

  document.getElementById("editStart").value = event.extendedProps.start;
  document.getElementById("editEnd").value = event.extendedProps.end;

  document.getElementById("editModal").classList.remove("hidden");
}

/* UPDATE */
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

/* DELETE */
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

  renderPlayersForDay();
}

/* WEEK */
function renderWeek() {

  const today = new Date();
  const container = document.getElementById("weekDays");

  container.innerHTML = "";

  const start = new Date(today);
  const end = new Date(today);

  end.setDate(end.getDate() + 6);

  document.getElementById("weekRange").textContent =
    `📅 Week of ${start.toLocaleDateString("fr-FR")} → ${end.toLocaleDateString("fr-FR")}`;

  for (let i = 0; i < 7; i++) {

    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const iso = d.toISOString().split("T")[0];

    const div = document.createElement("div");
    div.className = "week-day";

    if (iso === selectedDay) {
      div.classList.add("active");
    }

    div.textContent = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit"
    });

    div.onclick = () => {
      selectedDay = iso;
      renderWeek(); // met à jour le surlignage
      renderPlayersForDay();
    };

    container.appendChild(div);
  }
}

/* PLAYERS */
async function renderPlayersForDay() {

  const list = document.getElementById("playersList");
  list.innerHTML = "";

  const snapshot = await getDocs(collection(db, "availabilities"));

  let arr = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    if (d.date === selectedDay) arr.push(d);
  });

  arr.sort((a,b) => a.start.localeCompare(b.start));

  list.innerHTML = arr.map(p =>
    `<div class="player-card">
      <span class="player-name">${p.player}</span>
      <span>${p.start} - ${p.end}</span>
    </div>`
  ).join("");
}

/* MODALS */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");

  // affiche le pseudo dans la popup
  document.getElementById("modalPlayerName").textContent =
    currentPlayer || "No username";
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function closeEditModal() {
  document.getElementById("editModal").classList.add("hidden");
  selectedEvent = null;
}
