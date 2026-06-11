import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
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
let selectedEvent = null;

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
    },

    eventClick: function(info) {
      selectedEvent = info.event;

      document.getElementById("eventTitle").innerText =
        "📌 " + info.event.title;

      openEventModal();
    },

    eventDidMount: function(info) {
      if (info.event.extendedProps.dispo) {
        info.el.title =
          "Dispo: " + info.event.extendedProps.dispo.join(", ");
      }
    }
  });

  calendar.render();

  /* BUTTONS CREATE */
  document.getElementById("saveBtn").addEventListener("click", saveEvent);
  document.getElementById("closeBtn").addEventListener("click", closeModal);

  /* BUTTONS EVENT */
  document.getElementById("deleteBtn").addEventListener("click", deleteEvent);
  document.getElementById("cancelBtn2").addEventListener("click", closeEventModal);
  document.getElementById("newBtn").addEventListener("click", () => {
    closeEventModal();
    openModal();
  });
});

/* LOAD EVENTS */
async function loadEvents() {
  const snapshot = await getDocs(collection(db, "events"));

  let events = [];

  snapshot.forEach(doc => {
    events.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return events;
}

/* SAVE EVENT */
async function saveEvent() {
  const title = document.getElementById("title").value;

  if (!title) return alert("Nom requis");

  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  let dispo = [];

  checkboxes.forEach(cb => {
    if (cb.checked) dispo.push(cb.value);
  });

  const event = {
    title: title,
    start: selectedDate,
    dispo: dispo
  };

  await addDoc(collection(db, "events"), event);

  calendar.addEvent(event);

  closeModal();
  document.getElementById("title").value = "";

  checkboxes.forEach(cb => cb.checked = false);
}

/* DELETE EVENT */
async function deleteEvent() {
  if (!selectedEvent) return;

  await deleteDoc(doc(db, "events", selectedEvent.id));

  selectedEvent.remove();

  closeEventModal();
}

/* MODALS */
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function openEventModal() {
  document.getElementById("eventModal").classList.remove("hidden");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

/* CLICK OUTSIDE */
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modal");
  const eventModal = document.getElementById("eventModal");

  if (!modal.classList.contains("hidden") && e.target === modal) {
    closeModal();
  }

  if (!eventModal.classList.contains("hidden") && e.target === eventModal) {
    closeEventModal();
  }
});
