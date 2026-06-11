import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* 🔥 CONFIG FIREBASE */
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

let calendar;
let selectedDate = null;

/* INIT */
document.addEventListener("DOMContentLoaded", async function () {

  const calendarEl = document.getElementById("calendar");

  const events = await loadEvents();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,
    events: events,

    dateClick: function(info) {
      selectedDate = info.dateStr;
      openModal();
      document.getElementById("stats").innerText =
        "Date : " + selectedDate;
    }
  });

  calendar.render();

  document.getElementById("saveBtn").addEventListener("click", saveEvent);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
});

/* LOAD EVENTS */
async function loadEvents() {
  const snapshot = await getDocs(collection(db, "events"));

  let events = [];

  snapshot.forEach(doc => {
    events.push(doc.data());
  });

  return events;
}

/* SAVE EVENT */
async function saveEvent() {
  const title = document.getElementById("title").value;

  if (!title) {
    alert("Nom requis");
    return;
  }

  const event = {
    title: title,
    start: selectedDate
  };

  await addDoc(collection(db, "events"), event);

  calendar.addEvent(event);

  closeModal();
  document.getElementById("title").value = "";
}

/* MODAL */
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

/* CLICK OUTSIDE */
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modal");

  if (modal.classList.contains("hidden")) return;

  if (e.target === modal) {
    closeModal();
  }
});
