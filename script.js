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

      document.getElementById("stats").innerText =
        "Date sélectionnée : " + selectedDate;
    },

    events: []
  });

  calendar.render();

  // BUTTONS
  document.getElementById("saveBtn").addEventListener("click", saveEvent);
  document.getElementById("closeBtn").addEventListener("click", closeModal);

  console.log("JS chargé ✔");
});

/* MODAL */
function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

/* SAVE EVENT */
function saveEvent() {
  const title = document.getElementById("title").value;

  if (!title) {
    alert("Nom requis");
    return;
  }

  calendar.addEvent({
    title: title,
    start: selectedDate
  });

  closeModal();
  document.getElementById("title").value = "";
}

/* CLICK OUTSIDE TO CLOSE */
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modal");

  if (modal.classList.contains("hidden")) return;

  if (e.target === modal) {
    closeModal();
  }
});
