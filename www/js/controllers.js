"use strict";
angular.module('seiiDex.controllers', [])

.controller('LoadScreenCtrl', [
  '$scope',
  '$log',
  'FileTester',
  'PokeFetch',
  '$http',
  '$q',
  function($scope, $log, FileTester, PokeFetch, $http, $q) {
    var ls = this;

    ls.finishedLoading;

    ls.loadScreenTitle = "Loading...";
    ls.loadStatus = "Loading initial files...";

    ls.initialize = initialize;
    ls.testFiles = testFiles;
    ls.loadFilesIntoScope = loadFilesIntoScope;

    ls.initialize();

    function initialize() {
      $log.log("test?");
      FileTester.checkFiles()
      .then(function(results) { return ls.testFiles(results); })
      .then(function(results) { return ls.loadFilesIntoScope(results); })
      .catch(function(error) {
        $log.log("Error while loading files: ", error.message);
        $log.log("Attempting to create files");
        ls.loadScreenTitle = "Creating...";
        ls.loadStatus = "One or more files are missing, creating them now...";
        FileTester.createFiles()
        .then(function(result) {
          $log.log("Success: ", result);
          ls.loadScreenTitle = "Created!";
          ls.loadStatus = "Successfully created files!";
          //TODO: Figure out how to retry loading files from here
        });
      });
    };

    function testFiles(results) {

      var checkFileResults = [];
      angular.forEach(results, function(result) {
        checkFileResults.push($http.get(result.nativeURL).then(
          function(response) {
            return response.data;
          })
        );
        ls.loadStatus = "Total Files Loaded: " + checkFileResults.length;
      });

      return $q.all(checkFileResults);
    };

    function loadFilesIntoScope(results) {
      PokeFetch.initList(results);

      ls.loadScreenTitle = "Finished!";
      ls.loadStatus = "Successfully loaded " + results.length + " files!";
      ls.finishedLoading = true;
    };
  }
])

.controller('AppCtrl', [
  '$scope',
  '$ionicModal',
  '$timeout',
  '$ionicPlatform',
  '$log',
  '$ionicActionSheet',
  'StateTracker',
  '$state',
  function($scope, $ionicModal, $timeout, $ionicPlatform, $log, $ionicActionSheet, StateTracker, $state) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    var app = this;

    app.generations;

    app.showMenu = showMenu;
    app.parseButtons = parseButtons;

    app.generations = [
      {id: "1", desc: "Generation 1: Red/Blue/Yellow"},
      {id: "2", desc: "Generation 2: Gold/Silver/Crystal"},
      {id: "3", desc: "Generation 3: Ruby/Sapphire/Emerald/FireRed/LeafGreen"},
      {id: "4", desc: "Generation 4: Diamond/Pearl/Platinum/HeartGold/SoulSilver"},
      {id: "5", desc: "Generation 5: Black/White/Black 2/White 2"},
      {id: "6", desc: "Generation 6: X/Y/Alpha Sapphire/Omega Ruby"}
    ];

    function showMenu() {

      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: [
          {text: "Red/Blue/Yellow"},
          {text: "Gold/Silver/Crystal"},
          {text: "Ruby/Sapphire/Emerald"},
          {text: "FireRed/LeafGreen"},
          {text: "Diamond/Pearl/Platinum"},
          {text: "HeartGold/SoulSilver"},
          {text: "Black/White"},
          {text: "Black 2/White 2"},
          {text: "X/Y"},
          {text: "Alpha Sapphire/Omega Ruby"}
        ],
        titleText: 'Choose a group of games:',
        cancelText: 'Cancel',
        cancel: function() {
          // add cancel code..
          return true;
        },
        cssClass: "game-actionsheet",
        buttonClicked: function(index) {
          $log.log("Button clicked: ", index);
          StateTracker.setGen(app.parseButtons(index));
          $log.log("Setting generation: ", StateTracker.getGen());
          $state.go("app.generation");
          return true;
        }
      });
    };

    function parseButtons(index) {
      var trueValue;

      switch(index) {
        case 0:
          trueValue = 1;
          break;
        case 1:
          trueValue = 2;
          break;
        case 2:
        case 3:
          trueValue = 3;
          break;
        case 4:
        case 5:
          trueValue = 4;
          break;
        case 6:
        case 7:
          trueValue = 5;
          break;
        case 8:
        case 9:
          trueValue = 6;
          break;
      }

      return trueValue;
    };
  }
])

.controller('WelcomeCtrl', [
  '$scope',
  '$stateParams',
  function($scope, $stateParams) {
    var welcome = this;

    welcome.title = "Welcome!";
    welcome.greeting = "This is the SeiiDex, where you can find information on all 751 current Pokemon.";
    welcome.instructionsHeader = "How do I use it?";
    welcome.instructionsContent = "Tap the button at the bottom of the screen, then pick the general group of Pokemon games you're looking for information about. From there, just browse or search to find whatever you need!";
    welcome.creditHeader = "Credits:";
    welcome.creditContent = '"Veekun" (https://github.com/veekun/pokedex), whose data is the underpinnings of this entire application.';
  }
])

.controller('GenerationCtrl', [
  '$scope',
  '$log',
  'PokeFetch',
  'StateTracker',
  '$state',
  function($scope, $log, PokeFetch, StateTracker, $state) {
    var gen = this;

    gen.data;
    gen.thisGen;
    gen.goToPoke = goToPoke;

    gen.thisGen = StateTracker.getGen();
    $log.log("Selected generation: ", gen.thisGen);
    $log.log("Fetching data for Generation " + gen.thisGen);
    gen.data = PokeFetch.getPokeList(gen.thisGen);
    $log.log("Data: ", gen.data);

    function goToPoke(number, name) {
      $log.log("Number: ", number, "Name: ", name);
      var thisPoke = PokeFetch.getPoke(number, name, StateTracker.getGen());
      StateTracker.setCurrentPoke(thisPoke);
      $state.go("app.singlePoke");
    };
  }
])

.controller('SinglePokeCtrl', [
  '$scope',
  '$log',
  'PokeFetch',
  'StateTracker',
  function($scope, $log, PokeFetch, StateTracker) {
    var sp = this;

    sp.data;

    sp.generalHeader = "General:";
    sp.evolutionHeader = "Evolution:";
    sp.statsHeader = "Statistics:";
    sp.breedingHeader = "Breeding:";
    sp.evHeader = "Effort Values:";
    sp.movesHeader = "Moves:";
    sp.locationHeader = "Locations:";

    sp.data = StateTracker.getCurrentPoke();
    $log.log("Current Pokemon is: ", sp.data);
  }
]);
