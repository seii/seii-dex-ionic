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
  'PreferenceManager',
  'SeiiDexVersion',
  function($scope, $log, FileTester, PokeFetch, $http, $q, $ionicHistory, PreferenceManager, SeiiDexVersion) {
    var ls = this;

    ls.finishedLoading;
    ls.loopDetector = 0;

    ls.loadScreenTitle = "Loading...";
    ls.loadStatus = "Loading initial files...";

    ls.initialize = initialize;
    ls.loadCachedFiles = loadCachedFiles;
    ls.createNewFiles = createNewFiles;
    ls.testFiles = testFiles;
    ls.loadFilesIntoScope = loadFilesIntoScope;

    ls.initialize();

    //Prevent users from navigating backwards to this screen
    $ionicHistory.nextViewOptions({
      disableBack: true
    });

    function initialize() {
      /*
       * When checking the version, "success" still requires finding out if
       * the current version is obsolete. "failure" definitely means the
       * shared preference has never been set or has been cleared, and either
       * way the shared preference must be set.
       */
      PreferenceManager.getVersion()
      .then(function(version) {
        $log.debug("Version stored in Shared Preferences: ", version);

        //App has been updated, create new files
        if(version < SeiiDexVersion) {
          $log.log("Current version is out of date, beginning app update...");

          PreferenceManager.storeVersion(SeiiDexVersion)
          .then(function(result) {
            ls.createNewFiles();
          });
        }else {
          $log.log("App is up to date, continuing...");

          //App has not been updated, try to load cached files
          FileTester.checkFiles()
          .then(function(results) { return loadCachedFiles(results); })
          //Cached files are damaged or missing, create new files
          .catch(function(error) {
            $log.log("Failed to load cached files: ", error);
            return createNewFiles();
          });
        }
      })
      //App has no version set, reload after setting it
      .catch(function(error) {
        $log.log("No version found in shared preferences, setting it now ", error);
        PreferenceManager.storeVersion(SeiiDexVersion)
        .then(function(result) {
          $log.log("Version stored: ", result);
          ls.initialize();
        });
      });
    }

    function loadCachedFiles(cachedFiles) {
      $log.log("Attempting to load cached files");
      return ls.testFiles(cachedFiles)
              .then(function(results) { return ls.loadFilesIntoScope(results); });
    }

    function createNewFiles() {
      $log.log("Attempting to create new files");
      ls.loadStatus = "One or more required files are missing, attempting to create them...";
      ls.loopDetector++;
      $log.log("loopDetector: ", ls.loopDetector);

      //Quick and dirty way to prevent an infinite loop if there's a persistent error
      if(ls.loopDetector < 2) {
        ls.loadScreenTitle = "Creating...";
        ls.loadStatus = "Creating required files...";

        FileTester.createFiles()
        .then(function(result) {
          $log.log("Successfully created files: ", result);
          ls.loadScreenTitle = "Created!";
          ls.loadStatus = "Successfully created files!";
          $log.log("Attempting to initialize again");
          ls.initialize();
        });
      }else {
        $log.log("Failed to create files, loading loop detected");
        ls.loadScreenTitle = "Uh Oh!";
        ls.loadStatus = "One or more required files could not be created. As a result, this app can't continue operation. Please try exiting and re-launching the app. If that does not fix this problem, please reinstall the app.";
      }
    }

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
    }

    function loadFilesIntoScope(results) {
      $log.log("Loading into scope: ", results);
      PokeFetch.initList(results);

      ls.loadScreenTitle = "Finished!";
      ls.loadStatus = "Successfully loaded " + results.length + " files!";
      ls.finishedLoading = true;
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
  '$cordovaToast',
  function($scope, $ionicModal, $timeout, $ionicPlatform, $log, $ionicActionSheet, StateTracker, $state, PokeFetch, $cordovaToast) {

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
          $log.debug("Button clicked: ", index);
          StateTracker.setGen(app.parseButtons(index));
          $log.debug("Setting generation: ", StateTracker.getGen());
          StateTracker.setGame(index);
          $log.debug("Setting game: ", StateTracker.getGame());

          if($state.current.name == "app.welcome") {
            $log.debug("On Welcome screen, move to Generation screen");
            StateTracker.setCurrentPoke(null);
            $state.go("app.generation");
          }

          if($state.current.name == "app.generation") {
            $log.debug("On Generation screen, reload to show changes");
            StateTracker.setCurrentPoke(null);
            $state.go("app.generation",null,{reload: true});
          }

          if($state.current.name == "app.singlePoke") {
            $log.debug("Viewing a Pokemon, reload with selected Generation");
            var tempPoke = StateTracker.getCurrentPoke();
            $log.debug("tempPoke: ", tempPoke);
            var testPoke = PokeFetch.getPoke(tempPoke.nationalDex, tempPoke.name, tempPoke.form, StateTracker.getGen());
            $log.debug("testPoke: ", testPoke);

            //Choosing something invalid can return an "undefined" poke
            if(testPoke) {
              StateTracker.setCurrentPoke(testPoke);
              $state.go("app.singlePoke",null,{reload: true});
            }else {
              $log.debug("Invalid Pokemon chosen, warn the user");
              $cordovaToast.showLongCenter("This Pokemon doesn't exist in the game you've chosen. Please choose another game, or a different Pokemon!");
            }
          }

          if($state.current.name == "app.pokeMoves") {
            $log.debug("Viewing a Pokemon, reload with selected Generation");
            var tempPoke = StateTracker.getCurrentPoke();
            $log.debug("tempPoke: ", tempPoke);
            var testPoke = PokeFetch.getPoke(tempPoke.nationalDex, tempPoke.name, tempPoke.form, StateTracker.getGen());
            $log.debug("testPoke: ", testPoke);

            //Choosing something invalid can return an "undefined" poke
            if(testPoke) {
              StateTracker.setCurrentPoke(testPoke);
              $state.go("app.pokeMoves",null,{reload: true});
            }else {
              $log.debug("Invalid Pokemon chosen, warn the user");
              $cordovaToast.showLongCenter("This Pokemon doesn't exist in the game you've chosen. Please choose another game, or a different Pokemon!");
            }
          }

          if($state.current.name == "app.pokeLocations") {
            $log.debug("Viewing a Pokemon, reload with selected Generation");
            var tempPoke = StateTracker.getCurrentPoke();
            $log.debug("tempPoke: ", tempPoke);
            var testPoke = PokeFetch.getPoke(tempPoke.nationalDex, tempPoke.name, tempPoke.form, StateTracker.getGen());
            $log.debug("testPoke: ", testPoke);

            //Choosing something invalid can return an "undefined" poke
            if(testPoke) {
              StateTracker.setCurrentPoke(testPoke);
              $state.go("app.pokeLocations",null,{reload: true});
            }else {
              $log.debug("Invalid Pokemon chosen, warn the user");
              $cordovaToast.showLongCenter("This Pokemon doesn't exist in the game you've chosen. Please choose another game, or a different Pokemon!");
            }
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
  'SeiiDexVersion',
  function($scope, $stateParams, SeiiDexVersion) {
    var welcome = this;

    welcome.viewTitle = "SeiiDex - v" + SeiiDexVersion;

    welcome.cardGroup = [
      {title: "Welcome!", contents: ["This is the SeiiDex, where you can find information on all 751 current Pokemon. The SeiiDex is completely local to your device, with no internet connectivity required."], show: false},
      {title: "How do I use it?", contents: ["Tap the button at the bottom of the screen, then pick the group of Pokemon games that you're looking for information about. You can then browse or search the list (note: search also looks for pre-evolutions!) for the Pokemon you want information about."], show: false},
      {title: "What games are supported?", contents: ['This app uses outside database info (see the Credits) to display all games up through X/Y. ORAS isn\'t fully supported yet, so some things like "Wild Encounters" will be blank for ORAS.'], show: false},
      {title: "Credits", contents: ['"Veekun" (https://github.com/veekun/pokedex), whose data is the underpinnings of this entire application.'], show: false}
    ];

    welcome.toggleGroup = toggleGroup;
    welcome.isGroupShown = isGroupShown;

    /*
    * if given group is the selected group, deselect it
    * else, select the given group
    */
    function toggleGroup(group) {
      group.show = !group.show;
    };

    function isGroupShown(group) {
      return group.show;
    };
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
    gen.searchQuery;

    gen.thisGen = StateTracker.getGen();
    gen.thisGame = StateTracker.getGame();
    $log.debug("Initial generation: ", gen.thisGen);

    gen.goToPoke = goToPoke;

    $scope.$on('$ionicView.enter', function(e) {
      gen.thisGen = StateTracker.getGen();
      $log.debug("Selected generation: ", gen.thisGen);
      $log.debug("Fetching data for Generation " + gen.thisGen);
      gen.thisGame = StateTracker.getGame();
      $log.debug("Selected game: ", gen.thisGame);
      gen.data = PokeFetch.getPokeList(gen.thisGen);
      $log.debug("genData: ", gen.data);
      gen.dataAsArray = PokeFetch.listToArray(gen.data);
      $log.debug("genDataAsArray: ", gen.dataAsArray);
    });

    function goToPoke(number, name, form) {
      $log.debug("Number: ", number, "Name: ", name, "Form: ", form);
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
  '$state',
  function($scope, $log, PokeFetch, StateTracker, $state) {
    var sp = this;

    sp.data;
    sp.thisGen;

    sp.generalHeader = "General";
    sp.abilitiesHeader = "Abilities";
    sp.evolutionHeader = "Evolution";
    sp.statsHeader = "Statistics";
    sp.breedingHeader = "Breeding";
    sp.evHeader = "Effort Values";
    sp.movesHeader = "Moves";
    sp.locationsHeader = "Wild Encounter Locations";

    sp.showGeneral = false;
    sp.showAbilities = false;
    sp.showEvolution = false;
    sp.showStats = false;
    sp.showBreeding = false;
    sp.showEV = false;
    sp.showMoves = false;
    sp.showMovesCategory = false;
    sp.showMovesType = false;
    sp.showLocation = false;

    sp.toggleGroup = toggleGroup;
    sp.hideAll = hideAll;
    sp.goToMoves = goToMoves;

    $scope.$on('$ionicView.enter', function(e) {
      sp.data = StateTracker.getCurrentPoke();
      $log.debug("Current Pokemon is: ", sp.data);
      sp.thisGen = StateTracker.getGen();
    });

    /*
    * if given group is the selected group, deselect it
    * else, select the given group
    */
    function toggleGroup(group) {
      switch(group) {
        case "general":
          sp.showGeneral = !sp.showGeneral;
          break;
        case "abilities":
          sp.showAbilities = !sp.showAbilities;
          break;
        case "evolution":
          sp.showEvolution = !sp.showEvolution;
          break;
        case "stats":
          sp.showStats = !sp.showStats;
          break;
        case "breeding":
          sp.showBreeding = !sp.showBreeding;
          break;
        case "ev":
          sp.showEV = !sp.showEV;
          break;
        case "moves":
          sp.showMoves = !sp.showMoves;
          break;
        case 'movecategory':
          sp.showMovesCategory = !sp.showMovesCategory;
          break;
        case 'movetype':
          sp.showMovesType = !sp.showMovesType;
          break;
        case "location":
          sp.showLocation = !sp.showLocation;
          break;
        default:
          $log.log("Somehow ended up toggling an unrecognized group", group);
      }
    };

    function hideAll() {
      sp.showGeneral = false;
      sp.showAbilities = false;
      sp.showEvolution = false;
      sp.showStats = false;
      sp.showBreeding = false;
      sp.showEV = false;
      sp.showMoves = false;
      sp.showLocation = false;
    }

    function goToMoves() {
      $log.log("Moving!");
      $state.go("app.pokeMoves");
    }
  }
])

.controller('PokeMovesCtrl', [
  '$scope',
  '$log',
  'PokeFetch',
  'StateTracker',
  function($scope, $log, PokeFetch, StateTracker) {
    var mv = this;

    mv.data;
    mv.shownGroup;
    mv.shownSubGroup;
    mv.transformedMoves;

    mv.movesHeader = "Movesets";
    mv.moveTypeArray = [];
    mv.levelUpMoves = "levelUpMoves";
    mv.machineMoves = "machineMoves";
    mv.eggMoves = "eggMoves";
    mv.tutorMoves = "tutorMoves";

    mv.toggleGroup = toggleGroup;
    mv.isGroupShown = isGroupShown;
    mv.toggleSubGroup = toggleSubGroup;
    mv.isSubGroupShown = isSubGroupShown;
    mv.parseMoveType = parseMoveType;
    mv.narrowMovesToThisGame = narrowMovesToThisGame;
    mv.transformMoveData = transformMoveData;
    mv.isEmptyObject = isEmptyObject;

    $scope.$on('$ionicView.enter', function(e) {
      mv.data = StateTracker.getCurrentPoke();

      /*
      * Transforming "mv.data" directly would alter the JSON data which backs it
      *  until the application is completely restarted. To preserve the JSON
      *  data and alter it only as needed, use a "shadow" copy of "mv.data"
      *  that is copied fresh from the JSON data each time transformation is
      *  required.
      */
      mv.shadowData = JSON.parse(JSON.stringify(mv.data));

      $log.debug("Current Pokemon is: ", mv.data);
      $log.debug("Current shadow is: ", mv.shadowData);
      mv.thisGen = StateTracker.getGen();
      mv.thisGame = StateTracker.getGame();
      mv.transformedMoves = mv.narrowMovesToThisGame(mv.shadowData.moves);
      mv.transformedMoves = mv.transformMoveData(mv.transformedMoves);
      $log.debug("transformedMoves: ", mv.transformedMoves);
    });

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    function toggleGroup(group) {
      if (mv.isGroupShown(group)) {
        mv.shownGroup = null;
      } else {
        mv.shownGroup = group;
        mv.shownSubGroup = null;
      }
    };

    function isGroupShown(group) {
      return mv.shownGroup === group;
    };

    function toggleSubGroup(group) {
      if (mv.isSubGroupShown(group)) {
        mv.shownSubGroup = null;
      } else {
        mv.shownSubGroup = group;
      }
    };

    function isSubGroupShown(group) {
      return mv.shownSubGroup === group;
    };

    function parseMoveType(moveType) {
      $log.debug("Move type:", moveType);
      if (moveType == mv.levelUpMoves) {
        return 'Learned From Leveling';
      }else if (moveType == mv.machineMoves) {
        return 'Learned From TM/HM';
      }else if (moveType == mv.eggMoves) {
        return 'Learned From Breeding';
      }else if (moveType == mv.tutorMoves) {
        return 'Learned From Move Tutor';
      }else {
        return moveType;
      }
    }

    function narrowMovesToThisGame(moveData) {
      $log.debug("narrowMovesToThisGame data: ", moveData);

      var relevantGame = {};

      var thisGame = StateTracker.getGame();
      $log.debug("thisGame: ", thisGame);

      angular.forEach(moveData, function(value, key) {
        $log.debug("key: ", key);

        //Match exactly or partially
        if(thisGame == key || ~thisGame.indexOf(key)) {
          relevantGame[key] = value;
        }
      });

      $log.debug("final narrowed data: ", relevantGame);

      return relevantGame;
    }

    function transformMoveData(moveData) {
      $log.debug("transformMoveData start: ", moveData);

      var modMoveData = {};

      angular.forEach(moveData, function(gameValue, gameKey) {
        $log.debug("moveData: ", gameKey, gameValue);

        var gameName = gameKey;
        modMoveData[gameName] = {};

        angular.forEach(gameValue, function(catValue, catKey) {
          if(catKey == mv.levelUpMoves) {
            var tempLevelMoves = catValue;

            angular.forEach(catValue, function(value, key) {
              var levelSplit = key.split("-");
              //Only the actual level matters, not the ordering
              var level = levelSplit[0];

              var moveObj = PokeFetch.getMove(parseInt(value));
              moveObj.levelPretty = level;

              tempLevelMoves[key] = moveObj;
            });

            modMoveData[gameName][mv.parseMoveType(mv.levelUpMoves)] = tempLevelMoves;
          }else if(catKey == mv.machineMoves) {
            var tempMachineMoves = catValue;

            angular.forEach(catValue, function(value, key) {
              var moveObj = PokeFetch.getMove(parseInt(value));
              moveObj.machinePretty = key;

              tempMachineMoves[key] = moveObj;
            });

            modMoveData[gameName][mv.parseMoveType(mv.machineMoves)] = tempMachineMoves;
          }else {
            modMoveData[gameName][mv.parseMoveType(catKey)] = {};

            angular.forEach(catValue, function(value, key) {
              modMoveData[gameName][mv.parseMoveType(catKey)][key] = PokeFetch.getMove(parseInt(value));
            });
          }
        });
      });

      $log.debug("transformMoveData end: ", modMoveData);

      return modMoveData;
    }

    function isEmptyObject(testObj) {
      return angular.equals({}, testObj);
    }
  }
])

.controller('PokeLocationsCtrl', [
  '$scope',
  '$log',
  'PokeFetch',
  'StateTracker',
  function($scope, $log, PokeFetch, StateTracker) {
    var loc = this;

    loc.data;
    loc.transformedLocations;
    loc.requestedData;

    loc.shownGroup;
    loc.shownSubGroup;

    loc.locationsHeader = "Wild Encounter Locations";

    loc.toggleGroup = toggleGroup;
    loc.isGroupShown = isGroupShown;
    loc.toggleSubGroup = toggleSubGroup;
    loc.isSubGroupShown = isSubGroupShown;
    loc.isEmptyObject = isEmptyObject;
    loc.narrowMachinesToThisGame = narrowMachinesToThisGame;
    loc.whichDataRequested = whichDataRequested;
    loc.getObjKeys = getObjKeys;

    $scope.$on('$ionicView.enter', function(e) {
      loc.data = StateTracker.getCurrentPoke();
      $log.debug("Current Pokemon is: ", loc.data);
      loc.thisGen = StateTracker.getGen();
      loc.transformedLocations = loc.narrowMachinesToThisGame(loc.data.locations);
      $log.log("transformedLocations: ", loc.transformedLocations);
      loc.requestedData = loc.whichDataRequested();
      $log.log("requestedData: ", loc.requestedData);
    });

    /*
     * if given group is the selected group, deselect it
     * else, select the given group
     */
    function toggleGroup(group) {
      if (loc.isGroupShown(group)) {
        loc.shownGroup = null;
      } else {
        loc.shownGroup = group;
        loc.shownSubGroup = null;
      }
    };

    function isGroupShown(group) {
      return loc.shownGroup === group;
    };

    function toggleSubGroup(group) {
      if (loc.isSubGroupShown(group)) {
        loc.shownSubGroup = null;
      } else {
        loc.shownSubGroup = group;
      }
    };

    function isSubGroupShown(group) {
      return loc.shownSubGroup === group;
    };

    function isEmptyObject(testObj) {
      return angular.equals({}, testObj);
    }

    function narrowMachinesToThisGame(machineData) {
      $log.debug("narrowMachinesToThisGame data: ", machineData);

      var relevantGame = {};

      var thisGame = StateTracker.getGame();
      $log.debug("thisGame: ", thisGame);

      angular.forEach(machineData, function(value, key) {
        $log.debug("key: ", key);

        //Match exactly or partially
        if(thisGame == key || ~thisGame.indexOf(key)) {
          relevantGame[key] = value;
        }
      });

      $log.debug("final narrowed data: ", relevantGame);

      return relevantGame;
    }

    function whichDataRequested() {
      if(StateTracker.getGame() == "Omega Ruby/Alpha Sapphire") {
        return "ORAS";
      }else if(loc.isEmptyObject(loc.transformedLocations)) {
        return "Missing";
      }else {
        return "OK";
      }
    }

    function getObjKeys(obj) {
      if (!obj) {
        return [];
      }
      $log.log("thekeys: ", obj, Object.keys(obj));
      return Object.keys(obj);
    }
  }
]);
