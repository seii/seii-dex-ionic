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
    var copyFile;
    var unzipFiles;
    var deleteFile;

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

    //copyFile();

    copyFile = function() {
      var copyFileQ = $q.defer();

      $cordovaFile.copyFile(CDVFILE_PATH_TO_WWW, ZIP_FILE_NAME, cordova.file.dataDirectory, "")
      .then(function (success) {
        $log.log("Successfully copied " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW);
        copyFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to copy " + ZIP_FILE_NAME + " to " + CDVFILE_PATH_TO_WWW);
        copyFileQ.reject(error);
      });
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
    };

    deleteFile = function() {
      var deleteFileQ = $q.defer();

      $cordovaFile.removeFile(cordova.file.dataDirectory, ZIP_FILE_NAME)
      .then(function (success) {
        $log.log("Successfully deleted " + ZIP_FILE_NAME + " from " + CDVFILE_PATH_TO_WWW, success);
        deleteFileQ.resolve(success);
      }, function (error) {
        $log.log("Failed to delete " + ZIP_FILE_NAME + " from " + CDVFILE_PATH_TO_WWW, error);
        deleteFileQ.reject(error);
      });
    };

    return {
      checkFiles: function() {
        var deferred = $q.defer();
        var fileTestResults = [];

        $ionicPlatform.ready().then(function() {
          angular.forEach(fileNameArray, function(currentFile) {
            $log.log("Checking for file: " + currentFile);
            fileTestResults.push(testFile(currentFile));
          });

          $q.all(fileTestResults)
          .then(
            function(results) {
              $log.log("RESULTS: " + results);
              deferred.resolve(results);
            },
            function(errors) {
              $log.log("ERRORS: " + errors);
              deferred.reject(errors);
            },
            function(updates) {
              $log.log("UPDATES: " + updates);
              deferred.notify(updates);
            }
          );
        });

        return deferred.promise;
      }
    };
}])

.service('PokeFetch',
  ['$log',
  function($log) {
    var pokeGen1;
    var pokeGen2;
    var pokeGen3;
    var pokeGen4;
    var pokeGen5;
    var pokeGen6;

    return {
      getPoke: function(id, name, generation) {
        switch(generation) {
          case "1":
            break;
          case "2":
            break;
          case "3":
            break;
          case "4":
            break;
          case "5":
            break;
          case "6":
            break;
          default:
            $log.log("No matching generation found for " + generation + "!");
            break;
        }
      }
    }
}]);
