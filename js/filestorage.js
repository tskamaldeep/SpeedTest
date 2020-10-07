'use strict';
import * as logstring from './logstring.js';

const FILE_EXT = ".json";
const FILENAME_PREFIX = "export_";
const OBJECT_STORE_NAME = "speedtests";

let checkForIndexedDB = function () {
  return (indexedDB !== undefined);
}

let storeFileName = function (testID) {
  return (FILENAME_PREFIX + testID + FILE_EXT);
}

let createStore = function (storename, version = 1) {
  let timestr = new Date();

  let idbstore = indexedDB.open(storename, version, function (upgradedb) {
    console.log(logstring.speedTestLogString(timestr) +
      'Creating a new object store: ' + storename + '\n' + 'version: ' + version);
    if (!upgradedb.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      upgradedb.createObjectStore('OBJECT_STORE_NAME', {keypath: 'testID'});
    }
  });

  idbstore.onsuccess = function () {
    let iDB = idbstore.result;
    console.log(logstring.speedTestLogString(timestr) + 'Indexed DB store creation complete with name: ', storename);
  }

  idbstore.onerror = function () {
    console.error(logstring.speedTestLogString(timestr) + ' Error creating the indexedDB data store with name: ' + OBJECT_STORE_NAME);
    return null;
  }

  return idbstore;
}
//
// let storeFileHandle = function (fileName) {
//   var IDBHandle =
// }


