//Code structure is from module 18, lesson 4. We were instructed to look at this module/lesson for an overview on how to create indexdb functionality in this homework assignment.

// variable to hold db connection
let db;

// establishes a connection to IndexedDB database called 'budget_tracker' and sets it to version 1. Acts like an event listener for the db
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
  // saves a reference to the database 
  const db = event.target.result;
  // creates an object store (table) called `new_transaction`, sets it to have an auto incrementing primary key of sorts 
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, saves reference to db in global variable
  db = event.target.result;

  // checks if app is online, if yes runs uploadTransaction() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// This function will be executed if there is an attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
  // opens a new transaction with the database with read and write permissions 
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // accesses the object store for `new_transaction`
  const transactionObjectStore = transaction.objectStore('new_transaction');

  // adds a record to your store with the add method
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  // opens a transaction on the db
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // accesses the object store
  const transactionObjectStore = transaction.objectStore('new_transaction');

  // gets all records from store and sets to a variable
  const getAll = transactionObjectStore.getAll();
  // upon a successful .getAll() execution, runs this function
  getAll.onsuccess = function() {
    // if there was data in indexedDb's store, this sends it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // opens one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // accesses the new_transaction object store
          const transactionObjectStore = transaction.objectStore('new_transaction');
          // clears all items in the store
          transactionObjectStore.clear();

          alert('All saved transactions has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
}

// listens for app coming back online
window.addEventListener('online', uploadTransaction);