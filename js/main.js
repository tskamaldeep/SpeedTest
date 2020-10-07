'use strict';

import * as declarations from "./declarations.js";
import * as logstring from "./logstring.js";

let testInstance = null;
let testRequest = null;

let createNewTest = function () {
  testInstance = declarations.createNewTest();
  return testInstance;
};

let startSpeedTest = function () {
  testRequest = declarations.startSpeedTest(testInstance);
}

let stopSpeedTest = function (iterCount) {
  let testresult = declarations.stopSpeedTest(testInstance);
  let currentResultsObj = testInstance.get("testResults");

  // Add the iteration result to the set of results.
  currentResultsObj.set(iterCount.toString(), testresult);

  // Dispatch the event to abort download.
  testRequest.dispatchEvent(new ProgressEvent("abort"));

}

let resetSpeedTest = function (iterCount) {
  // See if save/export options need to be enabled through a modal here.
  // The testInstance needs to be saved/exported as a JSON.
  // Save the number of iterations for the current test.

  // Then reset the test instance.
  // Also handles creating a new test instance.
  let testresult = declarations.resetSpeedTest(testInstance);
  let currentResultsObj = testInstance.get("testResults");
  currentResultsObj.set(iterCount.toString(), testresult);

  // Dispatch the event before resetting download.
  testRequest.dispatchEvent(new ProgressEvent("abort"));

  // Reset with a new test.
  createNewTest();
}

let downloadURL = function () {
  return declarations.downloadURL;
}

let getProgressPercentageInt = function () {
  return Math.floor(declarations.getProgressPercentage(testInstance));
}

let getProgressPercentageFloat = function () {
  return declarations.getProgressPercentage(testInstance);
}

let setProgressPercentage = function (downloadedSize) {
  declarations.setProgressPercentage(testInstance, downloadedSize);
}

let getSpeedTestResults = function (iteration = -1) {
  let testresults = declarations.getSpeedTestResults(testInstance, iteration);
  return testresults;

}

let mapToObjJSON = function (inputmap) {
  let mapObj = {};
  let timestr = new Date();
  mapObj.testID = testInstance.get("testID");

  try {
    for (let [mapkey, mapval] of inputmap) {
      mapObj.mapkey = mapval;
    }

    return mapObj;
  } catch (e) {
    console.error(logstring.speedTestLogString(timestr) + "Map to JSON export error");
  }
}

let getAllSpeedTestResultsAsJSON = function () {
  let iterations = testInstance.get("iterations");
  let iteration = 1;
  let jsonBlob = null;

  while (iteration <= iterations) {
    let testresults = declarations.getSpeedTestResults(testInstance, iteration);

    // Create and populate the file.
    let jsonFile = new File(["export"], "export.json", {type: 'text/plain',});

    let jsonContents = mapToObjJSON(testresults);
    console.log(jsonContents);
    jsonBlob = new Blob([JSON.stringify(jsonContents, null, 2)], {type: 'application/json'});
    iteration++;
  }

  return jsonBlob;

}

export {
  createNewTest,
  startSpeedTest,
  stopSpeedTest,
  resetSpeedTest,
  downloadURL,
  getProgressPercentageInt,
  getProgressPercentageFloat,
  setProgressPercentage,
  getSpeedTestResults,
  getAllSpeedTestResultsAsJSON,
  testInstance,
  testRequest
};