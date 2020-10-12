'use strict';
import * as logstring from './logstring.js';
import * as testrequest from './speedtestrequest.js';
import {curProgress, requestStartTime} from "./speedtestrequest.js";

let downloadURL = "https://demo.unified-streaming.com/video/tears-of-steel/tears-of-steel.ism/dash/tears-of-steel-video_eng=751000-9600.dash";

// Test Status Flags
const TEST_STARTED = 1;
const TEST_STOPPED = 2;
const TEST_RESET = 3;
const speedtestStatuses = new Array({TEST_STARTED, TEST_STOPPED, TEST_RESET});

/////////////////////////////
// Test Progress Declarations
/////////////////////////////

const TEST_PROGRESS_MIN = 0;
const TEST_PROGRESS_MAX = Number(100).toFixed(2);

let getProgressPercentage = function (speedtest) {
    return curProgress.get("progressFloat");
};

let setProgressPercentage = function (speedtest, downloadedSize) {
    let timestr = new Date();

    if (!speedtest.isPrototypeOf(Map)) {
        console.error(logstring.speedTestLogString(timestr) + "Unexpected datatype error: " + speedtest.toString());
        return;
    }

    let dsize = isNaN(downloadedSize) ? 0 : downloadedSize;
    let totalsize = testrequest.totalSize;
    testrequest.setProgressPercentage(dsize, totalsize);

    // speedtest.get("currentProgress").set("progressFloat", testrequest.curProgress.get("progressFloat"));
    // speedtest.get("currentProgress").set("progressInt", testrequest.curProgress.get("progressInt"));
    //
    // let progress = speedtest.get("currentProgress");
    // progress.set("progressFloat", testrequest.curProgress.get("progressFloat"));
    // progress.set("progressInt", testrequest.curProgress.get("progressInt"));
}

let setResponseTimesFromTestResult = function (speedtest, newresponsetime) {
    const timestr = new Date();
    // set and return this value.
    let iterresult = {};

    let downloadtime = ((newresponsetime.loadEndTime >= newresponsetime.loadStartTime) ? (newresponsetime.loadEndTime - newresponsetime.loadStartTime) :
        ((newresponsetime.abortTime > newresponsetime.loadStartTime) ? (newresponsetime.abortTime - newresponsetime.loadStartTime) : 0));
    console.log("Download Time: ", downloadtime);

    try {
        let iterations = speedtest.get("iterations");
        let iterationsStr = (iterations - 1).toString();

        // console.log("Median: ", speedtest.get("testResults"), speedtest.get("testResults").get(iterationsStr).get("medianResponseTime"));
        let currentmediantime = (iterations === 1) ? 0 : (speedtest.get("testResults").get(iterationsStr).get("medianResponseTime"));
        let currentpercentile90time = (iterations === 1) ? 0 : (speedtest.get("testResults").get(iterationsStr).get("percentile90time"));

        // Set the result, at the least, with the current values in the try/catch.
        iterresult.medianresponsetime = currentmediantime;
        iterresult.percentile90time = currentpercentile90time;

        // Median time
        let newmediantime = ((((iterations - 1) * currentmediantime) + downloadtime) / (iterations)).toFixed(2);
        console.log("Current Median Time: ", currentmediantime, " ", "New Median Time: ", newmediantime);

        // 90th percentile time
        let newpercentile90time = (iterations === 1) ? newmediantime : currentpercentile90time;
        let modifiedpercentile = 0.9 * speedtest.get("iterations");

        // 14 samples 90th percentile = 30.42/40
        // 15th sample > 30.42
        //
        // 12.6 + 2.4 = 15
        // 0.84 = >30.42
        // 0.9 =>?

        if (downloadtime > currentpercentile90time) {
            modifiedpercentile = 0.9 * (speedtest.get("iterations") + 1);
            newpercentile90time = (0.9 * newpercentile90time) / modifiedpercentile;
        } else {
            modifiedpercentile = (modifiedpercentile + 1) / (speedtest.get("iterations") + 1);
            newpercentile90time = (0.9 * newpercentile90time) / modifiedpercentile;
        }

        iterresult.medianresponsetime = newmediantime;
        iterresult.percentile90time = newpercentile90time;

        return iterresult;

    } catch (e) {
        console.error(logstring.speedTestLogString(timestr) + e.message);
        return iterresult;
    }
};

let setSpeedTestResults = function (speedtest, iteration) {

    let resultEntries = new Map();

    // Fetch the download metadata:
    let downloadmetadata = testrequest.downloadmetadata;
    // Set the download metadata for the current iteration.
    resultEntries.set("downloadResults", downloadmetadata);

    let curresponsetime = downloadmetadata.get("responseTime");
    // Compute the median and percentile.
    let responseTimes = setResponseTimesFromTestResult(speedtest, curresponsetime);

    // Set the response times.
    resultEntries.set("medianResponseTime", responseTimes.medianresponsetime);
    resultEntries.set("percentile90time", responseTimes.percentile90time);

    // Set the result object.
    let testResults = speedtest.get("testResults");
    testResults.set(iteration.toString(), resultEntries);

}

//////////////////////
// Controller methods
//////////////////////

let createNewTest = function () {
    let numiterations = 0;

    let speedTest = new Map([
        ["testID", "VimeoSpeedTest_" + Math.floor(Math.random() * Math.pow(10, 7)).toString()],
        ["iterations", numiterations],
        ["downloadMetadata", new Map([
            ["requestURL", downloadURL],
            ["requestStartTime", testrequest.requestStartTime],
            ["responseTime", Number()],
            ["requestHeaders", new Headers()],
            ["responseHeaders", new Headers()],
        ])],
        ["currentTestStatus", TEST_RESET],
        ["currentProgress", new Map([
            ["progressInt", Number(0)],
            ["progressFloat", Number(0).toFixed(2)],
        ])],
        ["testResults", new Map()],
    ]);

    return speedTest;
};

let getTestStatus = function (speedtest) {
    return speedtest.get("currentTestStatus");
};

let getCurrentIteration = function (speedtest) {
    return speedtest.get("iterations");
}

let setTestStatus = function (speedtest, status) {
    const timestr = new Date();

    if (!status in speedtestStatuses) {
        console.error(logstring.speedTestLogString(timestr) + "Invalid test status specified.");
    }

    speedtest.set("currentTestStatus", status);
};

let startSpeedTest = function (speedtest) {
    const timestr = new Date();
    let iterations = speedtest.get("iterations");
    speedtest.set("iterations", (iterations === 0) ? 1 : iterations + 1);
    console.log(speedtest.get("iterations"));

    let testStatus = getTestStatus(speedtest);

    if (testStatus === TEST_STARTED) {
        console.debug(logstring.speedTestLogString(timestr) + "Test already started and in progress.");
        return;
    }

    if (testStatus === TEST_STOPPED) {
        console.debug(logstring.speedTestLogString(timestr) + "New test iteration started.");
    }

    console.debug(logstring.speedTestLogString(timestr) + "Starting speed test");

    // TODO: Initiate the necessary controller actions for the flag.
    let httprequest = testrequest.sendURLRequest(downloadURL, true);

    // Set the metadata on the provided speedtest object.
    // ...

    // Set the test status.
    setTestStatus(speedtest, TEST_STARTED);
    return httprequest;
};

let stopSpeedTest = function (speedtest) {
    const timestr = new Date();
    let testStatus = getTestStatus(speedtest);

    if (testStatus === TEST_STOPPED || testStatus === TEST_RESET) {
        console.debug(logstring.speedTestLogString(timestr) + "Test already stopped");
    }

    // Update the test results object.
    let iteration = speedtest.get("iterations");
    setSpeedTestResults(speedtest, iteration);

    console.debug(logstring.speedTestLogString(timestr) + "Stopping speed test");
    setTestStatus(speedtest, TEST_STOPPED);

};

let resetSpeedTest = function (speedtest) {
    const timestr = new Date();
    let testStatus = getTestStatus(speedtest);

    if (testStatus === TEST_RESET) {
        console.debug(logstring.speedTestLogString(timestr) + "Test already in reset state");
        return;
    }

    if (testStatus === TEST_STARTED || testStatus === TEST_STOPPED) {
        console.log(logstring.speedTestLogString(timestr) + "Initiating a test reset.");

        let iteration = speedtest.get("iterations");
        setSpeedTestResults(speedtest, iteration);

        setTestStatus(speedtest, TEST_RESET);
    }
};

let getSpeedTestResults = function (speedtest, iteration) {
    const timestr = new Date();

    let iter = (iteration < 0) ? speedtest.get("iterations") : iteration;

    try {
        let curiter = speedtest.get("iterations");

        if (iter > curiter) {
            console.error(logstring.speedTestLogString(timestr) + "Error in specifying test iteration: ", iteration);
            console.error(logstring.speedTestLogString(timestr) + "Capping to results of the max iteration");
            iter = Math.min(curiter, iter);
        }

        let testresults = speedtest.get("testResults").get(iter.toString());
        return testresults;

    } catch (e) {
        console.error(logstring.speedTestLogString(timestr) + "Error fetching test results for testID ", speedtest["testID"], " iteration: ", speedtest[iteration]);
        return null;
    }
}

export {
    createNewTest, speedtestStatuses, startSpeedTest, stopSpeedTest, resetSpeedTest, getProgressPercentage,
    setProgressPercentage, setResponseTimesFromTestResult, getTestStatus, setTestStatus, getSpeedTestResults,
    downloadURL, TEST_PROGRESS_MIN, TEST_PROGRESS_MAX
};
