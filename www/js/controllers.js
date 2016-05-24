"use strict";
angular.module('seiiDex.controllers', [])

.controller('LoadScreenCtrl', [
  '$scope',
  '$log',
  'FileTester',
  'PokeFetch',
  '$http',
  '$q',
  '$ionicHistory',
  function($scope, $log, FileTester, PokeFetch, $http, $q, $ionicHistory) {
    var ls = this;

    ls.finishedLoading;
    ls.loopDetector = 0;

    ls.loadScreenTitle = "Loading...";
    ls.loadStatus = "Loading initial files...";

    ls.initialize = initialize;
    ls.testFiles = testFiles;
    ls.loadFilesIntoScope = loadFilesIntoScope;
    ls.createFiles = createFiles;

    ls.initialize();

    //Prevent users from navigating backwards to this screen
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    function initialize() {
      FileTester.checkFiles()
      .then(function(results) { return ls.testFiles(results); })
      .then(function(results) { return ls.loadFilesIntoScope(results); })
      .catch(function(error) {
        $log.log("Error while loading files: ", error.message);
        ls.loadStatus = "One or more required files are missing, attempting to create them...";
        ls.loopDetector++;
        $log.log("loopDetector: ", ls.loopDetector);

        //Quick and dirty way to prevent an infinite loop if there's a persistent error
        if(ls.loopDetector < 2) {
          ls.createFiles();
        }else {
          $log.log("Failed to create files, loading loop detected");
          ls.loadScreenTitle = "Uh Oh!";
          ls.loadStatus = "One or more required files could not be created. As a result, this app can't continue operation. Please try exiting and re-launching the app. If that does not fix this problem, please reinstall the app.";
        }
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
      $log.log("Loading into scope: ", results);
      PokeFetch.initList(results);

      ls.loadScreenTitle = "Finished!";
      ls.loadStatus = "Successfully loaded " + results.length + " files!";
      ls.finishedLoading = true;
    };

    function createFiles() {
      $log.log("Attempting to create files");
      ls.loadScreenTitle = "Creating...";
      ls.loadStatus = "Creating required files...";

      FileTester.createFiles()
      .then(function(result) {
        $log.log("Success: ", result);
        ls.loadScreenTitle = "Created!";
        ls.loadStatus = "Successfully created files!";
        $log.log("Attempting to initialize again");
        ls.initialize();
      });
    }
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
  'PokeFetch',
  function($scope, $ionicModal, $timeout, $ionicPlatform, $log, $ionicActionSheet, StateTracker, $state, PokeFetch) {

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
    app.gameList;

    function showMenu() {

      //Create some buttons for the action sheet
      var menuButtons = function() {
        var tempArray = [];
        var tempList = StateTracker.getGameList();

        for(var i=0; i < tempList.length; i++) {
          var tempObj = {text: tempList[i]};
          tempArray.push(tempObj);
        }

        return tempArray;
      };

      // Show the action sheet
      var hideSheet = $ionicActionSheet.show({
        buttons: menuButtons(),
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
          StateTracker.setGame(index);
          $log.log("Setting game: ", StateTracker.getGame());

          if($state.current.name == "app.welcome") {
            $log.log("On Welcome screen, move to Generation screen");
            StateTracker.setCurrentPoke(null);
            $state.go("app.generation");
          }

          if($state.current.name == "app.generation") {
            $log.log("On Generation screen, reload to show changes");
            StateTracker.setCurrentPoke(null);
            $state.go("app.generation",null,{reload: true});
          }

          if($state.current.name == "app.singlePoke") {
            $log.log("Viewing a Pokemon, reload with selected Generation");
            var tempPoke = StateTracker.getCurrentPoke();
            $log.log("tempPoke: ", tempPoke);
            var testPoke = PokeFetch.getPoke(tempPoke.nationalDex, tempPoke.name, tempPoke.form, StateTracker.getGen());
            $log.log("testPoke: ", testPoke);
            StateTracker.setCurrentPoke(testPoke);
            $state.go("app.singlePoke",null,{reload: true});
          }

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
    gen.dataAsArray;
    gen.thisGen = StateTracker.getGen();
    gen.thisGame = StateTracker.getGame();
    $log.log("Initial generation: ", gen.thisGen);
    gen.goToPoke = goToPoke;

    $scope.$on('$ionicView.enter', function(e) {
      gen.thisGen = StateTracker.getGen();
      $log.log("Selected generation: ", gen.thisGen);
      $log.log("Fetching data for Generation " + gen.thisGen);
      gen.thisGame = StateTracker.getGame();
      $log.log("Selected game: ", gen.thisGame);
      gen.data = PokeFetch.getPokeList(gen.thisGen);
      $log.log("genData: ", gen.data);
      gen.dataAsArray = PokeFetch.listToArray(gen.data);
      $log.log("genDataAsArray: ", gen.dataAsArray);
    });

    function goToPoke(number, name, form) {
      $log.log("Number: ", number, "Name: ", name, "Form: ", form);
      var thisPoke = PokeFetch.getPoke(number, name, form, StateTracker.getGen());
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
    sp.thisGen;

    sp.generalHeader = "General:";
    sp.abilitiesHeader = "Abilities:";
    sp.evolutionHeader = "Evolution:";
    sp.statsHeader = "Statistics:";
    sp.breedingHeader = "Breeding:";
    sp.evHeader = "Effort Values:";
    sp.movesHeader = "Moves:";
    sp.locationsHeader = "Locations:";

    $scope.$on('$ionicView.enter', function(e) {
      sp.data = StateTracker.getCurrentPoke();
      $log.log("Current Pokemon is: ", sp.data);
      sp.thisGen = StateTracker.getGen();
    });
  }
]);
