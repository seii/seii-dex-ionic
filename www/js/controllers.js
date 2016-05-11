"use strict";
angular.module('seiiDex.controllers', [])

.controller('AppCtrl', ['$scope', '$ionicModal', '$timeout', '$ionicPlatform', '$log', 'FileTester', '$q', '$http',
            function($scope, $ionicModal, $timeout, $ionicPlatform, $log, FileTester, $q, $http) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  FileTester.checkFiles().then(function(results) {
    //$log.log(results);
    var checkFileResults = [];
    angular.forEach(results, function(result) {
      checkFileResults.push($http.get(result.nativeURL).then(
        function(response) {
          return response.data;
        })
      )
    })

    $q.all(checkFileResults)
    .then(function(results) {
      $scope.pokeGen1 = results[0];
      $scope.pokeGen2 = results[1];
      $scope.pokeGen3 = results[2];
      $scope.pokeGen4 = results[3];
      $scope.pokeGen5 = results[4];
      $scope.pokeGen6 = results[5];
      $scope.pokeMoves = results[6];
    });
  });

  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };
}])

.controller('PlaylistsCtrl', ['$scope', '$log', function($scope, $log) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
}])

.controller('PlaylistCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
}])


.controller('ChooseGenCtrl', ['$scope', '$log', function($scope, $log) {
  $scope.generations = [
    { title: 'Test1', id: 1 },
    { title: 'Test2', id: 2 },
    { title: 'Test3', id: 3 },
    { title: 'Test4', id: 4 },
    { title: 'Test5', id: 5 },
    { title: 'Test6', id: 6 }
  ];
}])

.controller('Gen1Ctrl', ['$scope', '$log', function($scope, $log) {
  
}]);
