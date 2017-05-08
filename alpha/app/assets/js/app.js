var synkitApp = angular.module('synkApp', ['ngRoute', 'ngAnimate', 'firebase', 'pagination']);

synkitApp.config(['$routeProvider', function ($routeProvider) {
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

    .when('/user/category', {
      templateUrl: 'views/category.html',
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
}])

  .run(['$rootScope', '$location', function ($rootScope, $location) {
    // Register listener to watch route changes
    $rootScope.$on('$locationChangeStart', function ( event, next, current) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          // $location.path('/');
          $rootScope.user = user;
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

    $scope.bookmarks = $firebaseArray(bookmarkRef);
    $scope.categories = $firebaseArray(categoryRef);

    $scope.categories.$loaded().then(function () {
      $scope.loading = false;
    });
 
    $scope.showAddBookmarkModal = function () {
      $scope.addModalRequest = true;
    };

    $scope.addBookmark = function (form) {
      $scope.formData = angular.copy(form);
      
      var title = $scope.formData.title;
      var url = $scope.formData.url;
      var urlCategory = $scope.formData.urlCategory;
    
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

      bookmark.categoryName = $scope.categories.$getRecord(urlCategory).name;

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

    $scope.cancelModal = function () {
      $scope.addModalRequest = false;
      $scope.editModalRequest = false;
      $scope.titleError = '';
      $scope.urlError = '';
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
}])

  .controller('AuthController', ['$scope', '$location', '$rootScope', function ($scope, $location, $rootScope) {
    $scope.error = '';

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
        console.log(user);
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

}])

.controller('CategoryController', ['$scope', '$rootScope', '$firebaseAuth', '$firebaseArray', 'appService', 'currentAuth', function ($scope, $rootScope, $firebaseAuth, $firebaseArray, appService, currentAuth) {
  $scope.pageTitle = 'Category Page';

  $scope.addCategoryModalRequest = false;
  $scope.editCategoryModalRequest = false;

  $scope.categoryError = '';

  $scope.loading = true;

  $scope.sortByName = true;
  $scope.sortByDate = false;
  $scope.orderProperty = 'name';
  
  var user = appService.getCurrentUser();
  
  const rootRef = firebase.database().ref().child(user.uid);
  const ref = rootRef.child('categories');

  var category = $firebaseArray(ref);

  $scope.categories = category;

  $scope.categories.$loaded().then(function () {
    $scope.loading = false;
  });


  $scope.showAddCategoryModal = function () {
    $scope.addCategoryModalRequest = true;
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

  $scope.cancelModal = function () {
    $scope.addCategoryModalRequest = false;
    $scope.editCategoryModalRequest = false;
    $scope.categoryError = '';
  };

  $scope.addCategory = function (form) {

    var now = new Date();    
    var today = now.getDate() + '/' +  ( now.getMonth() + 1) + '/' + now.getFullYear();
       
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
      console.log(form);
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
}]);