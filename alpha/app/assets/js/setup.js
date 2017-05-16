'use strict';
// Initialize Firebase
document.addEventListener('click', function (e) {
  var checkbox = document.querySelectorAll('.js-dropdown-toggle');
  var t = e.target;
  for (var i = 0; i < checkbox.length; i++) {
    if (t.getAttribute('id') != checkbox[i].getAttribute('id')) {
      checkbox[i].checked = false;
    }
  }
});
var config = {
  authDomain: "angularauth-b59d1.firebaseapp.com",
  databaseURL: "https://angularauth-b59d1.firebaseio.com",
  apiKey: "AIzaSyCjRbd_f7Y5Ses9v683QTG3iEVmIBRT1qA",
  projectId: "angularauth-b59d1",
  storageBucket: "angularauth-b59d1.appspot.com",
  messagingSenderId: "479677620649"
};
firebase.initializeApp(config);

var s2 = Swiped.init({
  query: '.swipeIt li',
  list: true,
  right: 200
});



var clipboard = new Clipboard('.copyToClipboard');

clipboard.on('success', function (e) {

  var element = e.trigger;

  element.className += ' tooltip tooltip-s';
  setTimeout(function () {
    element.removeAttribute('class', '');
    element.setAttribute('class', 'copyToClipboard');
  }, 1000);

  e.clearSelection();
});

clipboard.on('error', function (e) {
  console.error('Action:', e.action);
  console.error('Trigger:', e.trigger);
});