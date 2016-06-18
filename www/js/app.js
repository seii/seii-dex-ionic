"use strict";
// SeiiDex App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'seiiDex' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'seiiDex.controllers' is found in controllers.js
// 'seiiDex.factories' is found in factories.js
angular.module('seiiDex', ['ionic', 'seiiDex.controllers', 'seiiDex.services', 'ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('loadScreen', {
    //Blank URL actually matches the first screen, leaving "otherwise"
    //   directive available for errors and general use
    url: '',
    templateUrl: 'templates/loadScreen.html',
    controller: 'LoadScreenCtrl as loadCtrl'
  })

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl as appCtrl'
  })

  .state('app.welcome', {
    url: '/welcome',
    views: {
      'menuContent': {
        templateUrl: 'templates/welcome.html',
        controller: 'WelcomeCtrl as welcomeCtrl'
      }
    }
  })

  .state('app.generation', {
    url: '/generation',
    views: {
      'menuContent': {
        templateUrl: 'templates/generation.html',
        controller: 'GenerationCtrl as genCtrl'
      }
    }
  })

  .state('app.singlePoke', {
    url: '/singlePoke',
    views: {
      'menuContent': {
        templateUrl: 'templates/singlePoke.html',
        controller: 'SinglePokeCtrl as spCtrl'
      }
    }
  })

  .state('app.pokeMoves', {
    url: '/pokeMoves',
    views: {
      'menuContent': {
        templateUrl: 'templates/pokeMoves.html',
        controller: 'PokeMovesCtrl as mvCtrl'
      }
    }
  })

  .state('app.pokeLocations', {
    url: '/pokeLocations',
    views: {
      'menuContent': {
        templateUrl: 'templates/pokeLocations.html',
        controller: 'PokeLocationsCtrl as locCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/welcome');
});
