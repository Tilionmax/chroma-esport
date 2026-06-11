import { db, collection, addDoc, onSnapshot } from "./firebase.js";

// 👥 joueurs
const players = ["Joueur 1", "Joueur 2", "Joueur 3", "Joueur 4"];

let selectedDate = null;
let calendar;

// 🔔 DISCORD WEBHOOK
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/XXX";

document.addEventListener("DOMContentLoaded", () => {

  calendar = new FullCalendar.Calendar(document.getElementById("calendar"), {
    initialView: "dayGridMonth",
    dateClick: (info) => openModal(info.dateStr),
    events: []
  });

  calendar.render();

  // 🔥 LIVE FIRESTORE
  onSnapshot(collection(db, "events"), (snapshot) => {

    const events = [];

    snapshot.forEach(doc => {
      events.push(doc.data());
    });

    calendar.removeAllEvents();
    calendar.addEventSource(events);
  });
});

// 📌 OPEN MODAL
function openModal(date) {
  selectedDate = date;

  document.getElementById("modal").classList.remove("hidden");

  const container = document.getElementById("players");
  container.innerHTML = "";

  players.forEach(name => {
    container.innerHTML += `
      <div class="player">
        <span>${name}</span>
        <input type="checkbox" value="${name}">
      </div>
    `;
  });
}

// ❌ CLOSE
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// 💾 SAVE EVENT FIREBASE
async function saveEvent() {

  const title = document.getElementById("title").value;

  const checked = [...document.querySelectorAll("#players input:checked")]
    .map(e => e.value);

  if (!title || !selectedDate) return;

  const event = {
    title: `${title} (${checked.length} joueurs)`,
    start: selectedDate,
    allDay: true,
    players: checked,
    color: getColor(checked.length)
  };

  // ☁️ FIRESTORE
  await addDoc(collection(db, "events"), event);

  // 🔔 DISCORD NOTIF
  sendDiscord(event);

  closeModal();
}

// 🎨 COLOR SYSTEM
function getColor(count) {
  if (count >= 3) return "green";
  if (count >= 2) return "orange";
  return "red";
}

// 🔔 DISCORD
function sendDiscord(event) {
  fetch(DISCORD_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: `📅 Nouveau entraînement : **${event.title}** le ${event.start}`
    })
  });
}