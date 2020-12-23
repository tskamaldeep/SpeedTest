'use strict';
import * as logstring from './logstring.js';
import {exportJsonBlob} from "./main.js";

const FILE_EXT = ".json";
const FILENAME_PREFIX = "export_";
const OBJECT_STORE_NAME = "speedtests";
let idbstore = null;
let iDB = null;

let checkForIndexedDB = function () {
    return (indexedDB !== undefined);
}

let storeFileName = function (testID) {
    return (FILENAME_PREFIX + testID + FILE_EXT);
}

let addRequestWithTransaction = function (storeName) {

  // Initiate a transaction.
  let iDBtx = iDB.transaction([storeName], 'readwrite');
  let txstore = iDBtx.objectStore(storeName);
  let storeItem = exportJsonBlob;
  let addrequest = txstore.add(storeItem)

  addrequest.onsuccess = function () {
    console.log(logstring.speedTestLogString(new Date()) + " Finished adding record to the file.");
    iDBtx.stop();
  }

  addrequest.onerror = function () {
    console.error(logstring.speedTestLogString(new Date()) + " Error adding the store item.");
    iDBtx.stop();
  }
}

let saveContentsToStoreFile = function (storeName, jsonBlob, version = 1) {

    if (!checkForIndexedDB()) {
        console.error(logstring.speedTestLogString(new Date()) + "IndexedDB is not supported in the client");
        return;
    }

    if (idbstore === null) {
        let timestr = new Date();

        idbstore = indexedDB.open(storeName, version, function (upgradedb) {
            console.log(logstring.speedTestLogString(timestr) +
                'Creating a new object store: ' + storeName + '\n' + 'version: ' + version);
            if (!upgradedb.objectStoreNames.contains(OBJECT_STORE_NAME)) {
                upgradedb.createObjectStore(OBJECT_STORE_NAME, {keypath: 'testID'});
            }
        });

        idbstore.onsuccess = function (ev) {
            console.log(logstring.speedTestLogString(timestr) + 'Indexed DB store creation complete with name: ', storeName);
            iDB = ev.target.result;

            if (!iDB) {
                console.error(logstring.speedTestLogString(new Date()) + "IndexedDB has not been instantiated.");
                idbstore = null;
                return;
            }

            addRequestWithTransaction(OBJECT_STORE_NAME);
        }

        idbstore.onerror = function () {
            console.error(logstring.speedTestLogString(timestr) + ' Error creating the indexedDB data store with name: ' + OBJECT_STORE_NAME);
        }
    }
    else {
      addRequestWithTransaction(OBJECT_STORE_NAME);
    }
}

// Consider not exporting the storeFileName.
export {storeFileName, saveContentsToStoreFile};
