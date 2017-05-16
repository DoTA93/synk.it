var synkitApp = angular.module('synkApp', ['ngRoute', 'ngAnimate', 'firebase', 'pagination']);

synkitApp.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
      resolve: {
        "currentAuth": ["Auth", function (Auth) {
          return Auth.$waitForSignIn();
        }]
      }
    })

    .when('/auth/signup', {
      templateUrl: 'views/auth/signup.html',
      controller: 'AuthController'
    })

    .when('/auth/signin', {
      templateUrl: 'views/auth/signin.html',
      controller: 'AuthController'
    })

    .when('/user/category/:id?', {
      templateUrl: function (param) {
        var catId = param.id;
        if (catId) {
          return 'views/category-bookmarks.html';
        } else {
          return 'views/category.html';
        }        
      },
      // templateUrl: 'views/category.html',
      controller: 'CategoryController',
      resolve: {
        "currentAuth": ["Auth", function (Auth) {
          return Auth.$waitForSignIn();
        }]
      }
    })

    .otherwise({
      redirectTo: '/'
    });
  
  // $locationProvider.html5Mode(true);
}])

  .run(['$rootScope', '$location', function ($rootScope, $location) {
    // Register listener to watch route changes
    $rootScope.$on('$locationChangeStart', function (event, next, current) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          // $location.path('/');
          // $rootScope.user = user;
        } else {
          $location.path('/auth/signin');
        }
      });
    });
  }])

  .service('appService', ['$firebaseAuth', function ($firebaseAuth) {
    this.getCurrentUser = function () {
      var authObj = $firebaseAuth();
      var firebaseUser = authObj.$getAuth();
      return firebaseUser;
    }
  }])
  
  .factory("Auth", ["$firebaseAuth",
    function ($firebaseAuth) {
      return $firebaseAuth();
    }
  ])

  .controller('HomeController', ['$scope', '$firebaseArray', '$rootScope', 'appService', 'currentAuth', function ($scope, $firebaseArray, $rootScope, appService, currentAuth) {
    $scope.pageTitle = 'Home page';
    $scope.addModalRequest = false;
    $scope.editModalRequest = false;
    $scope.url = '';
    $scope.titleError = '';
    $scope.urlError = '';

    $scope.orderProperty = 'title';

    $scope.sortByTitle = true;
    $scope.sortByCategory = false;
    $scope.sortByDate = false;

    $scope.loading = true;

    var user = appService.getCurrentUser();

    const rootRef = firebase.database().ref().child(user.uid);
    const categoryRef = rootRef.child('categories');
    const bookmarkRef = rootRef.child('bookmarks');

    var bookmarks = $firebaseArray(bookmarkRef);
    $scope.categories = $firebaseArray(categoryRef);

    $scope.categories.$loaded().then(function () {
      
      angular.forEach(bookmarks, function (bookmark, key) {
        var urlCategory = bookmark.category;
        if (urlCategory == null) {
          bookmark.categoryName = 'Uncategorised';
        } else {
          bookmark.categoryName = $scope.categories.$getRecord(urlCategory).name;
        }
      });
      $scope.bookmarks = bookmarks;
      $scope.loading = false;
    });
 
    $scope.showAddBookmarkModal = function () {
      $scope.addModalRequest = true;
    };

    $scope.addBookmark = function (form) {
      $scope.formData = angular.copy(form);
      
      var title = $scope.formData.title;
      var url = $scope.formData.url;
      var urlCategory = $scope.formData.urlCategory || null;
    
      if (!title || !url) {
        
        if (!title) {
          $scope.titleError = 'Please enter a valid title';
        }
        if (!url) {
          $scope.urlError = 'Please enter a valid Url';
        }
        
        return;
      }
      var now = new Date();
      var today = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
      
      var bookmark = {
        title: title,
        url: url,
        category: urlCategory,
        modified: today
      };

      // if (!urlCategory) {
      //   bookmark.categoryName = 'Uncategorised';
      // } else {
      //   bookmark.categoryName = $scope.categories.$getRecord(urlCategory).name;
      // }

      $scope.bookmarks.$add(bookmark);
      $scope.addModalRequest = false;

      form.title = '';
      form.urlCategory = '';
      form.url = '';
    };

    $scope.deleteBookamrk = function (bookmark) {
      $scope.bookmarks.$remove(bookmark);
    };

    $scope.editBookmarkRequest = function (bookmark) {
      $scope.form = {};
      $scope.editModalRequest = true;
      $scope.form.title = bookmark.title;
      $scope.form.url = bookmark.url;
      $scope.form.id = bookmark.$id;
      $scope.form.urlCategories = $scope.categories;
      $scope.form.urlCategory = $scope.categories.$getRecord(bookmark.category).$id;
    };

    $scope.editBookmark = function (form) {
      $scope.formData = angular.copy(form);
      var title = $scope.formData.title;
      var url = $scope.formData.url;

      if (!title || !url) {

        if (!title) {
          $scope.titleError = 'Please enter a valid title';
        }
        if (!url) {
          $scope.urlError = 'Please enter a valid Url';
        }

        return;
      }

      var now = new Date();
      var today = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();

      var id = $scope.formData.id;
      var record = $scope.bookmarks.$getRecord(id);

      record.title = title;
      record.url = url;
      record.modified = today;
      record.category = $scope.formData.urlCategory;
      record.categoryName = $scope.categories.$getRecord($scope.formData.urlCategory).name;

      $scope.bookmarks.$save(record);

      $scope.titleError = '';
      $scope.urlError = '';
      $scope.editModalRequest = false;

      form.title = '';
      form.urlCategory = '';
      form.url = '';
    };

    $scope.cancelModal = function (form) {
      $scope.addModalRequest = false;
      $scope.editModalRequest = false;

      $scope.titleError = '';
      $scope.urlError = '';

      form.title = '';
      form.urlCategory = '';
      form.url = '';
    };

    $scope.setOrderProperty = function (propertyName) {
      
      if ($scope.orderProperty === propertyName) {
        $scope.orderProperty = '-' + propertyName;
      } else if ($scope.orderProperty == '-' + propertyName) {
        $scope.orderProperty = propertyName;
      } else {
        $scope.orderProperty = propertyName;
      }

      if (propertyName === 'title') {
        $scope.sortByTitle = true;
        $scope.sortByCategory = false;
        $scope.sortByDate = false;
      } else if (propertyName === 'categoryName') {
        $scope.sortByTitle = false;
        $scope.sortByCategory = true;
        $scope.sortByDate = false;
      } else {
        $scope.sortByTitle = false;
        $scope.sortByCategory = false;
        $scope.sortByDate = true;
      }
    };

    $scope.showQrModal = function (bookmark) {
      
      var html = '';

      // instanciate new modal
      var modal = new tingle.modal({
        footer: true,
        stickyFooter: true,
        closeMethods: [],
        closeLabel: "Close",
        // cssClass: ['custom-class-1', 'custom-class-2'],
        onOpen: function () {
          console.log('modal open');
        },
        onClose: function () {
          console.log('modal closed');
        },
        beforeClose: function () {
          return true; // close the modal
        }
      });

      html += '<div id="qrcode"></div>';
      html += '<div class="input-group">';
      html += '<p>'+ bookmark.url +'</p>';
      html += '<button aria-label="Copied" ng-click="copyToClipboard()" data-clipboard-text="'+ bookmark.url +'" class="copyToClipboard" type="button">';
      html += 'Copy to clipboard';
      html += '</button></div>';

      // set content
      modal.setContent(html);

      // add a button
      modal.addFooterBtn('Close', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function () {
        // here goes some logic
        modal.close();
        
      });

      // add another button
      // modal.addFooterBtn('Dangerous action !', 'tingle-btn tingle-btn--danger', function () {
      //   // here goes some logic
      //   modal.close();
      // });

      

      var qrcode = new QRCode("qrcode", {
        text: bookmark.url,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });

      qrcode.makeCode(bookmark.url);
      // open modal
      modal.open();
    };
    
  }])

  .controller('AuthController', ['$scope', '$location', '$rootScope', 'appService', function ($scope, $location, $rootScope, appService) {
    $scope.error = '';
    $scope.user = null;

    $scope.windowWidth = document.documentElement.clientWidth;

    window.onresize = function () {
      $scope.$apply(function () {
        $scope.windowWidth = document.documentElement.clientWidth;
      });
    }
    // signin methods
    $scope.signInWithGoogle = function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/plus.login');

      firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // console.log(user);
        $scope.user = user;
        $rootScope.$apply(function () {
          $location.path('/');
        });
        
      }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        $scope.error = '"' + email + '" is already registered with different authentication method';
        $rootScope.$apply();
      });
    };

    $scope.signInWithFacebook = function () {
      var provider = new firebase.auth.FacebookAuthProvider();

      firebase.auth().signInWithPopup(provider).then(function (result) {
        // This gives you a Facebook Access Token. You can use it to access the Facebook API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...
        $scope.user = user;
      }).catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
        $scope.error = '"' + email + '" is already registered with different authentication method';
        $rootScope.$apply();
      });
    };

    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        // Sign-out successful.
        $rootScope.$apply(function () {
          $location.path('/auth/signin');
        });
      }).catch(function (error) {
        // An error happened.
      });
    };

    $scope.user = appService.getCurrentUser() || 'https://randomuser.me/api/portraits/men/51.jpg';

  }])

  .controller('CategoryController', ['$scope', '$rootScope', '$firebaseAuth', '$firebaseArray', 'appService', 'currentAuth', '$routeParams', function ($scope, $rootScope, $firebaseAuth, $firebaseArray, appService, currentAuth, $routeParams) {
    var categoryId = $routeParams.id;

    // $scope.pageTitle = '';

    $scope.addCategoryModalRequest = false;
    $scope.editCategoryModalRequest = false;

    $scope.categoryError = '';

    $scope.loading = true;

    $scope.sortByName = true;
    $scope.sortByDate = false;
    $scope.orderProperty = 'name';

    var user = appService.getCurrentUser();

    const rootRef = firebase.database().ref().child(user.uid);
    


    if (categoryId) {

      const catRef = rootRef.child('categories');

      var categories = $firebaseArray(catRef);

      categories.$loaded().then(function (data) {
        var record = data.$getRecord(categoryId);
        $scope.pageTitle = 'Bookmarks under "' + record.name + '"';
      });

      const ref = rootRef.child('bookmarks');
      var bookmarks = $firebaseArray(ref);
      $scope.bookmarks = [];
      
      bookmarks.$loaded().then(function (data) {
        angular.forEach(data, function (bookmark, key) {
          
          if (bookmark.category == categoryId) {
            $scope.bookmarks.push(bookmark);
          }
        });

        $scope.loading = false;
      });
      
    } else {
      $scope.pageTitle = 'Category Page';
      const ref = rootRef.child('categories');

      var categories = $firebaseArray(ref);

      $scope.categories = categories;

      $scope.categories.$loaded().then(function () {
        $scope.loading = false;
      });
    }
    


    $scope.showAddCategoryModal = function () {
      $scope.addCategoryModalRequest = true;
      // var html = '';
      // // html +='<div class="modal" ng-show="addCategoryModalRequest">';
      // // html +='<div class="modal-content">';
      // // html +='<div class="header">';
      // html +='<h2>Add Category</h2>';
      // // html +='</div>';
      // // html +='<div class="copy">';
      // html +='<form ng-submit="addCategory(form)" autocomplete="off">';
      // html +='<div class="input-group">';
      // html +='<label for="name">Category name</label>';
      // html +='<input type="text" id="name" class="form-input" ng-model="form.name" placeholder="Enter category name">';
      // html +='<span class="error">{{ categoryError }}</span>';
      // html +='</div>';
      // html +='<button type="sumbit" class="btn btn-submit">Add Category</button>';
      // html +='</form>';
      // html +='<button class="btn btn-cancel" ng-click="cancelModal(form)">Cancel</button>';
      // // html +='</div>';
      // // html +='</div>';
      // // html +='</div>';
      
      
      // // instanciate new modal
      // var modal = new tingle.modal({
      //   footer: true,
      //   stickyFooter: true,
      //   closeMethods: [],
      //   closeLabel: "Close",
      //   cssClass: ['custom-class-1', 'custom-class-2'],
      //   onOpen: function () {
      //     console.log('modal open');
      //   },
      //   onClose: function () {
      //     console.log('modal closed');
      //   },
      //   beforeClose: function () {
      //     return true; // close the modal
      //   }
      // });

      // // set content
      // modal.setContent(html);

      // // add a button
      // modal.addFooterBtn('Close', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function () {
      //   // here goes some logic
      //   modal.close();

      // });

      // // add another button
      // // modal.addFooterBtn('Dangerous action !', 'tingle-btn tingle-btn--danger', function () {
      // //   // here goes some logic
      // //   modal.close();
      // // });

      // // open modal
      // modal.open();

    };

    $scope.editCategoryShow = function (category) {
      $scope.formData = {};
      $scope.editCategoryModalRequest = true;
      $scope.formData.id = category.$id;
      $scope.formData.name = category.name;
    };

    $scope.deleteCategory = function (category) {
      $scope.categories.$remove(category);
    };

    $scope.cancelModal = function (form) {
      $scope.addCategoryModalRequest = false;
      $scope.editCategoryModalRequest = false;
      
      form.name = '';
      $scope.categoryError = '';
    };

    $scope.addCategory = function (form) {

      var now = new Date();
      var today = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
        
      if (!form) {
        $scope.categoryError = 'Please enter a valid name';
        return;
      }

      var params = angular.copy(form);
      var name = params.name;

      // add category to the database
      $scope.addCategoryModalRequest = false;
      params.name = '';
      $scope.categoryError = '';

      category.$add({
        name: name,
        modified: today
      }).then(function (ref) {
        var id = ref.key;
        // console.log(form);
        form.name = '';
        console.log('added with id', id);
      });
    };

    $scope.editCategory = function () {
      var now = new Date();
      var name = $scope.formData.name;
      if (!name) {
        return;
      }

      var today = now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();

      var id = $scope.formData.id;
      var record = $scope.categories.$getRecord(id);

      record.name = name;
      record.modified = today;

      $scope.categories.$save(record);
      $scope.formData.name = '';
      $scope.editCategoryModalRequest = false;
    };

    $scope.setOrderProperty = function (propertyName) {

      if ($scope.orderProperty === propertyName) {
        $scope.orderProperty = '-' + propertyName;
      } else if ($scope.orderProperty == '-' + propertyName) {
        $scope.orderProperty = propertyName;
      } else {
        $scope.orderProperty = propertyName;
      }
      if (propertyName === 'name') {
        $scope.sortByName = true;
        $scope.sortByDate = false;
      } else if (propertyName === 'modified') {
        $scope.sortByName = false;
        $scope.sortByDate = true;
      }
    };

  }])

  .controller('MainController', ['$scope', '$rootScope', 'Auth', 'appService', '$location', function ($scope, $rootScope, Auth, appService, $location) {
    $scope.windowWidth = document.documentElement.clientWidth;
    
    // $scope.user = null;
    $scope.loading = true;

    window.onresize = function () {
      $scope.$apply(function () {
        $scope.windowWidth = document.documentElement.clientWidth;
      });
    }
    Auth.$waitForSignIn().then(function (user) {
      
      $scope.user = user;
      $scope.user.firstName = (user.displayName).split(' ')[0];
      
      $scope.loading = false;
    });

    $scope.signOut = function () {
      firebase.auth().signOut().then(function () {
        // Sign-out successful.
        $rootScope.$apply(function () {
          $location.path('/auth/signin');
        });
      }).catch(function (error) {
        // An error happened.
      });
    };

    $scope.getPath = function (path) {
      return ($location.path() == path) ? 'active' : '';
    }

    $scope.navigate = function (path) {
      if ($scope.windowWidth < 640) {
        document.getElementById('nav-state').checked = true;
      }
      $location.path(path);
    }
    
    // console.log(Auth);
  }]);