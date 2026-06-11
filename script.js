import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* FIREBASE */
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

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const calendarEl = document.getElementById("calendar");

  const events = await loadAll();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    events: events,

    dateClick: (info) => {
      selectedDate = info.dateStr;
      openAvailModal();
    }
  });

  calendar.render();

  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);
});

/* 🔥 LOAD FIRESTORE */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(doc => {
    const d = doc.data();

    events.push({
      title: `🟢 ${d.player} (${d.start}-${d.end})`,
      start: d.date
    });
  });

  return events;
}

/* 💾 SAVE AVAILABILITY */
async function saveAvailability() {
  const player = document.getElementById("playerName").value;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) {
    alert("Remplis tout");
    return;
  }

  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  /* 🔄 REFRESH CALENDAR PROPREMENT */
  calendar.removeAllEvents();

  const refreshed = await loadAll();
  refreshed.forEach(ev => calendar.addEvent(ev));

  closeAvailModal();
}

/* MODAL */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}
