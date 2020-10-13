'use strict';
import * as logstring from './logstring.js';
import {exportJsonBlob} from "./main";

const FILE_EXT = ".json";
const FILENAME_PREFIX = "export_";
const OBJECT_STORE_NAME = "speedtests";
let idbstore = null;

let checkForIndexedDB = function () {
  return (indexedDB !== undefined);
}

let storeFileName = function (testID) {
  return (FILENAME_PREFIX + testID + FILE_EXT);
}

let createStore = function (storename, version = 1) {

  if (idbstore !== null)
    return;

  let timestr = new Date();

  idbstore = indexedDB.open(storename, version, function (upgradedb) {
    console.log(logstring.speedTestLogString(timestr) +
      'Creating a new object store: ' + storename + '\n' + 'version: ' + version);
    if (!upgradedb.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      upgradedb.createObjectStore('OBJECT_STORE_NAME', {keypath: 'testID'});
    }
  });

  idbstore.onsuccess = function () {
    console.log(logstring.speedTestLogString(timestr) + 'Indexed DB store creation complete with name: ', storename);
  }

  idbstore.onerror = function () {
    console.error(logstring.speedTestLogString(timestr) + ' Error creating the indexedDB data store with name: ' + OBJECT_STORE_NAME);
  }
}

let saveContentsToStoreFile = function(jsonBlob) {
  if (!checkForIndexedDB()) {
    console.error(logstring.speedTestLogString(new Date()) + "IndexedDB is not supported in the client");
    return;
  }

  // Create the object store first.
  createStore('SpeedTest');

  let iDB = idbstore.result;
  console.log(iDB);

  let iDBtx = iDB.transaction([OBJECT_STORE_NAME], 'readwrite');
  let txstore = iDBtx.objectStore(OBJECT_STORE_NAME);
  let storeItem = exportJsonBlob;
  let addrequest = txstore.add(storeItem)

  addrequest.onsuccess  = function() {
    console.log(logstring.speedTestLogString(new Date()) + " Finished adding record to the file.");
    iDBtx.stop();
  }

  addrequest.onerror = function () {
    console.error(logstring.speedTestLogString(new Date()) + " Error adding the store item.");
    iDBtx.stop();
  }
}

// Consider not exporting the storeFileName.
export {storeFileName, createStore, saveContentsToStoreFile};
