"use strict";
angular.module('seiiDex.services', [])

.service('FileTester',
  ['$ionicPlatform',
  '$log',
  '$cordovaFile',
  '$cordovaZip',
  '$q',
  function($ionicPlatform, $log, $cordovaFile, $cordovaZip, $q) {
    var ZIP_FILE_NAME = "json.zip";
    var CDVFILE_PATH_TO_WWW = "cdvfile://localhost/assets/www/";

    var testFile;
    var copyZipFile;
    var unzipFiles;
    var deleteZipFile;

    var fileNameArray = [
      'Pokemon1.json',
      'Pokemon2.json',
      'Pokemon3.json',
      'Pokemon4.json',
      'Pokemon5.json',
      'Pokemon6.json',
      'Moves.json'
    ];

    testFile = function(file) {
      var testFileQ = $q.defer();

      $cordovaFile.checkFile(cordova.file.dataDirectory, file)
      .then(function (success) {
        // success
        $log.log("File " + file + " already exists, skipping unzip step\n", success);

        testFileQ.resolve(success);
      }, function (error) {
        // error
        $log.log("File " + file + " doesn't exist, unzipping JSON files\n", error);

        testFileQ.reject(error);
      });

      return testFileQ.promise;
    };

    copyZipFile = function() {
      var copyZipFileQ = $q.defer();

      $cordovaFile.copyFile(CDVFILE_PATH_TO_WWW, ZIP_FILE_NAME, cordova.file.dataDirectory, "")
      .then(function (success) {
        $log.log("Successfully copied " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW);
        copyZipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to copy " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW);
        copyZipFileQ.reject(error);
      });

      return copyZipFileQ.promise;
    };

    unzipFiles = function() {
      var unzipFileQ = $q.defer();

      $cordovaZip.unzip(
        cordova.file.dataDirectory + ZIP_FILE_NAME,
        cordova.file.dataDirectory
      ).then(function (success) {
        $log.log("Successfully unzipped " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW, success);
        unzipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to unzip " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW, error);
        unzipFileQ.reject(error);
      });

      return unzipFileQ.promise;
    };

    deleteZipFile = function() {
      var deleteZipFileQ = $q.defer();

      $cordovaFile.removeFile(cordova.file.dataDirectory, ZIP_FILE_NAME)
      .then(function (success) {
        $log.log("Successfully deleted " + ZIP_FILE_NAME + " from " + CDVFILE_PATH_TO_WWW, success.fileRemoved.name);
        deleteZipFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to delete " + ZIP_FILE_NAME + " from " + CDVFILE_PATH_TO_WWW, error);
        deleteZipFileQ.reject(error);
      });

      return deleteZipFileQ.promise;
    };

    return {
      checkFiles: function() {
        var fileTestResults = [];

        return $ionicPlatform.ready()
        .then(function() {
          angular.forEach(fileNameArray, function(currentFile) {
            $log.log("Checking for file: ", currentFile);
            fileTestResults.push(testFile(currentFile));
          });

          return $q.all(fileTestResults);
        });
      },
      createFiles: function() {

        return $ionicPlatform.ready().then(function() {
          $log.log("Platform is ready for file creation via Cordova plugins");
          $log.log("Attempting to copy ZIP file");
          return copyZipFile()
          .then(function(copyFileResult) {
            $log.log("Attempting to unzip base file");
            return unzipFiles();
          })
          .then(function(unzipFileResult) {
            $log.log("Attempting to delete ZIP file");
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
      "Alpha Sapphire/Omega Ruby"
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

    return {
      initList: function(dataArray) {
        pf.pokeData = dataArray;
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
      }
    }
  }
]);
