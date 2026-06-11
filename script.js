let calendar;
let selectedDate = null;

document.addEventListener("DOMContentLoaded", function () {

  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    selectable: true,

    dateClick: function(info) {
      selectedDate = info.dateStr;
      openModal();
      document.getElementById("stats").innerText = "Date sélectionnée : " + selectedDate;
    },

    events: []
  });

  calendar.render();
});

// MODAL
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// EVENTS
function saveEvent() {
  const title = document.getElementById("title").value;

  if (!title) return alert("Nom requis");

  calendar.addEvent({
    title: title,
    start: selectedDate
  });

  closeModal();
  document.getElementById("title").value = "";
}

// BUTTONS (IMPORTANT)
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveBtn").addEventListener("click", saveEvent);
  document.getElementById("closeBtn").addEventListener("click", closeModal);
});
