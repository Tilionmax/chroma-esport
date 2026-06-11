body {
  margin: 0;
  font-family: Arial;
  background: #0f172a;
  color: white;
}

.container {
  max-width: 1100px;
  margin: auto;
  padding: 20px;
}

h1 {
  text-align: center;
}

#calendar {
  background: white;
  padding: 10px;
  border-radius: 10px;
  color: black;
}

/* MODAL */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #1e293b;
  padding: 20px;
  border-radius: 10px;
  width: 380px;
}

.hidden {
  display: none;
}

input {
  width: 100%;
  padding: 10px;
  margin: 10px 0;
}

button {
  margin: 5px;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.player {
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
  padding: 5px;
  background: #334155;
  border-radius: 5px;
}

.stats {
  margin-top: 20px;
  background: #1e293b;
  padding: 10px;
  border-radius: 10px;
}
