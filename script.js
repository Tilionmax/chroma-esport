import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* 🔥 FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "chroma-esport.firebaseapp.com",
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.appspot.com",
  messagingSenderId: "TON_ID",
  appId: "TON_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* VARIABLES */
let calendar;
let selectedDate = null;
let selectedAvailDate = null;

/* INIT */
document.addEventListener("DOMContentLoaded", async function () {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,
    events: events,

    /* 📅 CLICK JOUR = DISPONIBILITÉ */
    dateClick: function(info) {
      selectedAvailDate = info.dateStr;
      openAvailModal();
    }
  });

  calendar.render();

  /* EVENTS */
  document.getElementById("saveBtn").addEventListener("click", saveEvent);
  document.getElementById("closeBtn").addEventListener("click", closeModal);

  /* DISPO */
  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);
});

/* 🔥 LOAD ALL (events + dispos) */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(doc => {
    const d = doc.data();

    events.push({
      title: "🟢 " + d.player + " (" + d.start + "-" + d.end + ")",
      start: d.date,
      player: d.player,
      start: d.start,
      end: d.end
    });
  });

  return events;
}

/* 💾 SAVE EVENT (scrim / training) */
async function saveEvent() {
  const title = document.getElementById("title").value;

  if (!title) return alert("Nom requis");

  await addDoc(collection(db, "events"), {
    title: title,
    start: selectedDate
  });

  calendar.addEvent({
    title: title,
    start: selectedDate
  });

  closeModal();
}

/* 🕒 SAVE DISPONIBILITÉ */
async function saveAvailability() {
  const player = document.getElementById("playerName").value;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) {
    alert("Remplis tout");
    return;
  }

  const event = {
    player: player,
    date: selectedAvailDate,
    start: start,
    end: end
  };

  await addDoc(collection(db, "availabilities"), event);

  calendar.addEvent({
    title: "🟢 " + player + " (" + start + "-" + end + ")",
    start: selectedAvailDate
  });

  closeAvailModal();
}

/* MODALS */
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}
