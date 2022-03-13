let db;

const request = indexedDB.open("bankTransaction", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;

  db.createObjectStore("new_bankTransaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run uploadIndex() function to send all local db data to api
  if (navigator.onLine) {
    uploadBankTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_bankTransaction"], "readwrite");

  const bankTransactionObjectStore = transaction.objectStore("new_bankTransaction");

  bankTransactionObjectStore.add(record);
}

function uploadBankTransaction() {
  const transaction = db.transaction(["new_bankTransaction"], "readwrite");

  const bankTransactionObjectStore = transaction.objectStore("new_bankTransaction");

  const getAll = bankTransactionObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["new_bankTransaction"], "readwrite");

          const bankTransactionObjectStore = transaction.objectStore("new_bankTransaction");

          bankTransactionObjectStore.clear();

          alert("All saved bank transactions has been submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBankTransaction);
