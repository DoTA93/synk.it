// Initialize Firebase
var config = {
  apiKey: "AIzaSyCjRbd_f7Y5Ses9v683QTG3iEVmIBRT1qA",
  authDomain: "angularauth-b59d1.firebaseapp.com",
  databaseURL: "https://angularauth-b59d1.firebaseio.com",
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

// instanciate new modal
// var modal = new tingle.modal({
//   footer: true,
//   stickyFooter: false,
//   closeMethods: ['overlay', 'button', 'escape'],
//   closeLabel: "Close",
//   cssClass: ['custom-class-1', 'custom-class-2'],
//   onOpen: function () {
//     console.log('modal open');
//   },
//   onClose: function () {
//     console.log('modal closed');
//   },
//   beforeClose: function () {
//     // here's goes some logic
//     // e.g. save content before closing the modal
//     return true; // close the modal
//   }
// });