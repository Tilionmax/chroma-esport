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
let currentPlayer = "";

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
    },

    eventClick: (info) => {
      handleDelete(info.event);
    }
  });

  calendar.render();

  document.getElementById("saveAvailBtn").addEventListener("click", saveAvailability);
  document.getElementById("closeAvailBtn").addEventListener("click", closeAvailModal);
});

/* LOAD FIRESTORE */
async function loadAll() {
  const snapshot = await getDocs(collection(db, "availabilities"));

  let events = [];

  snapshot.forEach(docSnap => {
    const d = docSnap.data();

    events.push({
      id: docSnap.id,
      title: `🟢 ${d.player} (${d.start}-${d.end})`,
      start: d.date,
      extendedProps: {
        player: d.player
      }
    });
  });

  return events;
}

/* SAVE AVAILABILITY */
async function saveAvailability() {
  const player = document.getElementById("playerName").value;
  const start = document.getElementById("startHour").value;
  const end = document.getElementById("endHour").value;

  if (!player || !start || !end) {
    alert("Remplis tout");
    return;
  }

  currentPlayer = player;

  await addDoc(collection(db, "availabilities"), {
    player,
    date: selectedDate,
    start,
    end
  });

  calendar.removeAllEvents();

  const refreshed = await loadAll();
  refreshed.forEach(ev => calendar.addEvent(ev));

  closeAvailModal();
}

/* DELETE ONLY OWN AVAILABILITY */
async function handleDelete(event) {

  const eventPlayer = event.extendedProps.player;

  if (!currentPlayer) {
    alert("Entre ton pseudo d'abord");
    return;
  }

  if (eventPlayer !== currentPlayer) {
    alert("Tu ne peux supprimer que tes propres disponibilités");
    return;
  }

  const confirmDelete = confirm("Supprimer ta disponibilité ?");

  if (!confirmDelete) return;

  await deleteDoc(doc(db, "availabilities", event.id));

  event.remove();
}

/* MODAL */
function openAvailModal() {
  document.getElementById("availModal").classList.remove("hidden");
}

function closeAvailModal() {
  document.getElementById("availModal").classList.add("hidden");
}
