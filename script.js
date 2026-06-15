import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs
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

    dateClick: (info) => {
      if (!currentPlayer) return openUsernameModal();

      selectedDate = info.dateStr;
      selectedDay = info.dateStr;

      openAvailModal();
      renderPlayersForDay();
    }
  });

  calendar.render();

  /* BUTTONS */
  document.getElementById("createEventBtn").onclick = () => {
    if (currentPlayer !== "Tikafx") return alert("Admin uniquement");
    document.getElementById("eventModal").classList.remove("hidden");
  };

  document.getElementById("saveEventBtn").onclick = saveEvent;
  document.getElementById("closeEventBtn").onclick = closeEventModal;

  document.getElementById("saveAvailBtn").onclick = saveAvailability;
  document.getElementById("closeAvailBtn").onclick = closeAvailModal;

  document.getElementById("saveUsernameBtn").onclick = saveUsername;
  document.getElementById("closeUsernameBtn").onclick = closeUsernameModal;

  updateUI();
  renderWeek();
  renderPlayersForDay();
  listenEvents(); // 🔥 REAL TIME
});

/* USER */
function updateUI() {
  document.getElementById("playerText").textContent =
    currentPlayer ? `Connecté : ${currentPlayer}` : "";
}

/* USERNAME */
function openUsernameModal() {
  document.getElementById("usernameModal").classList.remove("hidden");
}

function closeUsernameModal() {
  document.getElementById("usernameModal").classList.add("hidden");
}

function saveUsername() {
  currentPlayer = document.getElementById("usernameInput").value;
  localStorage.setItem("playerName", currentPlayer);
  updateUI();
  closeUsernameModal();
}

/* EVENTS REALTIME */
function listenEvents() {

  onSnapshot(collection(db, "events"), (snap) => {

    let html = "";

    snap.forEach(docSnap => {

      const e = docSnap.data();

      const participants = e.participants || {};
      const yes = [];
      const no = [];

      Object.entries(participants).forEach(([p, v]) => {
        if (v) yes.push(p);
        else no.push(p);
      });

      html += `
        <div class="event-card">

          <b>${e.title}</b><br>
          📅 ${e.date}<br>
          🕒 ${e.start} - ${e.end}

          <button onclick="setAttendance('${docSnap.id}', true)">✔️ Je participe</button>
          <button onclick="setAttendance('${docSnap.id}', false)">❌ Absent</button>

          <div class="yes">✔️ ${yes.join(", ") || "-"}</div>
          <div class="no">❌ ${no.join(", ") || "-"}</div>

        </div>
      `;
    });

    document.getElementById("eventsList").innerHTML =
      html || "Aucun event";
  });
}

/* RSVP */
window.setAttendance = async (id, status) => {

  const snap = await getDocs(collection(db, "events"));

  let data;

  snap.forEach(d => {
    if (d.id === id) data = d.data();
  });

  data.participants[currentPlayer] = status;

  await deleteDoc(doc(db, "events", id));
  await addDoc(collection(db, "events"), data);
};

/* CREATE EVENT */
async function saveEvent() {

  await addDoc(collection(db, "events"), {
    title: document.getElementById("eventTitle").value,
    date: document.getElementById("eventDate").value,
    start: document.getElementById("eventStart").value,
    end: document.getElementById("eventEnd").value,
    participants: {}
  });

  closeEventModal();
}

/* AVAIL */
async function saveAvailability() {

  await addDoc(collection(db, "availabilities"), {
    player: currentPlayer,
    date: selectedDate,
    start: document.getElementById("startHour").value,
    end: document.getElementById("endHour").value
  });

  closeAvailModal();
}

/* LOAD CALENDAR */
async function loadAll() {

  const snap = await getDocs(collection(db, "availabilities"));

  let events = [];

  snap.forEach(d => {
    const e = d.data();

    events.push({
      title: `${e.player} (${e.start}-${e.end})`,
      start: e.date
    });
  });

  return events;
}

/* WEEK */
function renderWeek() {
  const c = document.getElementById("weekDays");
  c.innerHTML = "";
}

/* PLAYERS */
function renderPlayersForDay() {
  document.getElementById("playersList").innerHTML = "";
}

/* MODALS */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}
