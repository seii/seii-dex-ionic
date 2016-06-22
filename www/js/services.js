"use strict";
angular.module('seiiDex.services', [])

.service('PreferenceManager',
  ['$ionicPlatform',
  '$log',
  '$cordovaPreferences',
  'SeiiDexVersion',
  function($ionicPlatform, $log, $cordovaPreferences, SeiiDexVersion) {
    var pm = this;

    pm.storeVersion = storeVersion;
    pm.getVersion = getVersion;

    function storeVersion() {
      return $cordovaPreferences.store('seiiDexVersion', SeiiDexVersion)
        .success(function(value) {
          $log.log("Successfully stored app version in shared preferences " + value);
        })
        .error(function(error) {
          $log.log("Failed to store app version in shared preferences " + error);
        })
    }

    function getVersion() {
      return $cordovaPreferences.fetch('seiiDexVersion')
        .success(function(value) {
          $log.log("Retrieved version from shared preferences: ", value);
        })
        .error(function(error) {
          $log.log("Failed to retrieve version from shared preferences ", error);
        })
    }

    return {
      storeVersion : function() {
        return $ionicPlatform.ready()
        .then(function () {
          return pm.storeVersion();
        });
      },
      getVersion : function() {
        return $ionicPlatform.ready()
        .then(function () {
          return pm.getVersion();
        });
      }
    };
  }
])

.service('FileTester',
  ['$ionicPlatform',
  '$log',
  '$cordovaFile',
  '$cordovaZip',
  '$q',
  function($ionicPlatform, $log, $cordovaFile, $cordovaZip, $q) {
    var ft = this;

    ft.ZIP_FILE_NAME = "json.zip";
    ft.CDVFILE_PATH_TO_WWW = "cdvfile://localhost/assets/www/";

    ft.testFile = testFile;
    ft.copyZipFile = copyZipFile;
    ft.unzipFiles = unzipFiles;
    ft.deleteZipFile = deleteZipFile;

    ft.fileNameArray = [
      'Pokemon1.json',
      'Pokemon2.json',
      'Pokemon3.json',
      'Pokemon4.json',
      'Pokemon5.json',
      'Pokemon6.json',
      'Moves.json'
    ];

    function testFile(file) {
      var testFileQ = $q.defer();

      $cordovaFile.checkFile(cordova.file.dataDirectory, file)
      .then(function (success) {
        // success
        $log.log("File " + file + " already exists\n", success);

        testFileQ.resolve(success);
      }, function (error) {
        // error
        $log.log("File " + file + " doesn't exist\n", error);

        testFileQ.reject(error);
      });

      return testFileQ.promise;
    };

    function copyZipFile() {
      var copyZipFileQ = $q.defer();

      $cordovaFile.copyFile(ft.CDVFILE_PATH_TO_WWW, ft.ZIP_FILE_NAME, cordova.file.dataDirectory, "")
      .then(function (success) {
        $log.log("Successfully copied " + ft.ZIP_FILE_NAME + " to " + ft.CDVFILE_PATH_TO_WWW, success);
        copyZipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to copy " + ft.ZIP_FILE_NAME + " to " + ft.CDVFILE_PATH_TO_WWW, error);
        copyZipFileQ.reject(error);
      });

      return copyZipFileQ.promise;
    };

    function unzipFiles() {
      var unzipFileQ = $q.defer();

      $cordovaZip.unzip(
        cordova.file.dataDirectory + ft.ZIP_FILE_NAME,
        cordova.file.dataDirectory
      ).then(function (success) {
        $log.log("Successfully unzipped " + ft.ZIP_FILE_NAME + " to " + cordova.file.dataDirectory, success);
        unzipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to unzip " + ft.ZIP_FILE_NAME + " to " + cordova.file.dataDirectory, error);
        unzipFileQ.reject(error);
      });

      return unzipFileQ.promise;
    };

    function deleteZipFile() {
      var deleteZipFileQ = $q.defer();

      $cordovaFile.removeFile(cordova.file.dataDirectory, ft.ZIP_FILE_NAME)
      .then(function (success) {
        $log.log("Successfully deleted " + ft.ZIP_FILE_NAME + " from " + cordova.file.dataDirectory, success);
        deleteZipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to delete " + ft.ZIP_FILE_NAME + " from " + cordova.file.dataDirectory, error);
        deleteZipFileQ.reject(error);
      });

      return deleteZipFileQ.promise;
    };

    return {
      checkFiles: function() {
        var fileTestResults = [];

        return $ionicPlatform.ready()
        .then(function() {
          angular.forEach(ft.fileNameArray, function(currentFile) {
            $log.log("Checking for file: ", currentFile);
            fileTestResults.push(testFile(currentFile));
          });

          return $q.all(fileTestResults);
        });
      },
      createFiles: function() {

        return $ionicPlatform.ready()
        .then(function() {
          $log.log("Platform is ready for file creation via Cordova plugins");
          $log.log("Attempting to copy initial ZIP file");
          return ft.copyZipFile()
          .then(function(copyFileResult) {
            $log.log("Attempting to unzip base file");
            return ft.unzipFiles();
          })
          .then(function(unzipFileResult) {
            $log.log("Attempting to delete initial ZIP file");
            return deleteZipFile();
          });
        });
      }
    };
  }
])

.service('StateTracker',
  ['$log',
  function($log) {
    var st = this;

    st.currentGen;
    st.currentGame;
    st.currenPoke;

    st.gameList = [
      "Red/Blue/Yellow",
      "Gold/Silver/Crystal",
      "Ruby/Sapphire/Emerald",
      "FireRed/LeafGreen",
      "Diamond/Pearl/Platinum",
      "HeartGold/SoulSilver",
      "Black/White",
      "Black 2/White 2",
      "X/Y",
      "Omega Ruby/Alpha Sapphire"
    ];

    return {
      getGen: function() {
        return st.currentGen;
      },
      setGen: function(data) {
        st.currentGen = data;
      },
      getGame: function() {
        return st.currentGame;
      },
      setGame: function(data) {
        st.currentGame = st.gameList[data];
      },
      getGameList: function() {
        return st.gameList;
      },
      getCurrentPoke: function() {
        return st.currentPoke;
      },
      setCurrentPoke: function(data) {
        st.currentPoke =  data;
      }
    }
  }
])

.service('PokeFetch',
  ['$log',
  function($log) {
    var pf = this;

    pf.pokeData;
    pf.moveData;

    return {
      initList: function(dataArray) {
        pf.pokeData = dataArray;
        pf.moveData = pf.pokeData[pf.pokeData.length - 1];
        $log.debug("moveData: ", pf.moveData);
      },
      getPokeList: function(generation) {
        return pf.pokeData[generation - 1];
      },
      getPoke: function(id, name, form, generation) {
        var onePoke = pf.pokeData[generation - 1];

        return onePoke[id + " - " + name];
      },
      listToArray: function(someList) {
        var tempArray = [];
        angular.forEach(someList, function(x) {
          tempArray.push(x);
        });

        return tempArray;
      },
      getMove: function(moveId) {
        var thisMove = pf.moveData[moveId];

        return thisMove;
      }
    }
  }
]);
