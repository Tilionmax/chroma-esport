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
  databaseURL: "https://chroma-esport-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "chroma-esport",
  storageBucket: "chroma-esport.firebasestorage.app",
  messagingSenderId: "555749328122",
  appId: "1:555749328122:web:5765da259633ef047e3543"
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

  /* ESC pour fermer modal */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAvailModal();
  });
});

/* 🔥 LOAD FIRESTORE */
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

/* 💾 SAVE */
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

/* 🗑 DELETE ONLY OWN */
async function handleDelete(event) {

  const eventPlayer = event.extendedProps.player;

  if (!currentPlayer) {
    alert("Entre ton pseudo pour supprimer");
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

/* clic backdrop */
window.backdropClose = function(event) {
  closeAvailModal();
};
