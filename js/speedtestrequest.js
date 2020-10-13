// 'use strict';

import * as logstring from './logstring.js';

let requestStartTime = 0;

let responseTime = {};
responseTime.loadStartTime = 0;
responseTime.loadEndTime = 0;
responseTime.abortTime = 0;
responseTime.progressTime = new Array();
responseTime.errorReportTime = 0;

let downloadmetadata = new Map([
  ["requestURL", ""],
  ["responseTime", {}],
  ["requestHeaders", new Headers()],
  ["responseHeaders", new Headers()],
]);

// For the progress indicator.
let curProgress = new Map([["progressFloat", parseFloat("0")], ["progressInt", parseInt("0")]]);
let totalSize = 0;

let fetchResponseTime = function (eventtype) {
  let reference = requestStartTime;
  let timestr = new Date();

  switch (eventtype.type) {
    case ('loadstart'):
      timestr = new Date();
      responseTime.loadStartTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - reference;
      break;
    case('loadend'):
      timestr = new Date();
      responseTime.loadEndTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - reference;
      break;
    case('progress'):
      timestr = new Date();
      let totalSeconds = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - reference;
      responseTime.progressTime.push(totalSeconds);
      break;
    case ('abort'):
      timestr = new Date();
      responseTime.abortTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - reference;
      break;
    case('error'):
      timestr = new Date();
      responseTime.errorReportTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - reference;
      break;
  }

  return responseTime;
}

let setProgressPercentage = function (bytesloaded, bytestotal) {

  let mbytesloaded = isNaN(bytesloaded) ? 0 : bytesloaded;
  let progress = Math.min((mbytesloaded * 100 / bytestotal).toFixed(2), 100.00);
  curProgress.set("progressFloat", progress);
  curProgress.set("progressInt", Math.floor(progress));
};

let sendURLRequest = function (urlstring, cacheresource = true) {

  let navigatorobj = window.navigator;
  let useragent = navigatorobj.userAgent;
  let timestr = new Date();
  let referenceTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000;

  try {

    let responsetime = {};
    let httpRequest = new XMLHttpRequest();
    downloadmetadata.set("requestURL", urlstring);

    // set the credentials.
    httpRequest.withCredentials = false;

    // For response time computations.
    requestStartTime = referenceTime;
    console.log("Request Start Time: ", requestStartTime);

    httpRequest.open('GET', urlstring, true);
    // httpRequest.setRequestHeader('Access-Control-Allow-Headers', '*');
    // httpRequest.setRequestHeader('content-type', 'video/mp4');

    ////////////////////////////////////////////////////////////////////////////////////////////
    // Provisional headers. Are these allowed in request header settings or is an error flagged?
    // httpRequest.setRequestHeader('Access-Control-Allow-Headers', '*');
    // httpRequest.setRequestHeader('Access-Control-Allow-Credentials', "true");
    // httpRequest.setRequestHeader('method', 'GET');
    ////////////////////////////////////////////////////////////////////////////////////////////

    // Set the cache header accordingly.
    // if (cacheresource) {
    //   httpRequest.setRequestHeader('cache-control', 'no-cache, max-age=0');
    //   // httpRequest.setRequestHeader('pragma', 'no-cache');
    // } else {
    //   httpRequest.setRequestHeader('cache-control', 'no-store');
    // }

    // add the event listeners.
    httpRequest.onloadstart = function (ev) {
      responsetime = fetchResponseTime(ev);
      downloadmetadata.set("responseTime", responsetime);
      downloadmetadata.set("responseHeaders", httpRequest.getAllResponseHeaders());
      // Set starting progress
      totalSize = ev.total;
      setProgressPercentage(ev.loaded, ev.total);


      console.log(ev.type + " - " + ev.timeStamp + " - " + ev.currentTarget + " - " + ev.toString() + " - " + ev.total);
      console.log("Progress at Start: ", curProgress.get("progressFloat").toString());
    }

    httpRequest.onloadend = function (ev) {
      responsetime = fetchResponseTime(ev);
      downloadmetadata.set("responseTime", responsetime);
      downloadmetadata.set("responseHeaders", httpRequest.getAllResponseHeaders());

      // Set progress on completion and clear the interval handler.
      setProgressPercentage(ev.loaded, ev.total);
      clearInterval(setProgressPercentage);

      console.log(ev.type + " - " + ev.timeStamp + " - " + ev.currentTarget + " - " + ev.toString() + " - " + ev.loaded + " - " + ev.total);
      console.log("Progress at Load End: ", curProgress.get("progressFloat").toString());

    }

    httpRequest.onprogress = function (ev) {
      responsetime = fetchResponseTime(ev);
      downloadmetadata.set("responseTime", responsetime);

      // Progress interval updation.
      setProgressPercentage(ev.loaded, ev.total);

      console.log("Loaded: ", ev.loaded, "\n",   "Total; ", ev.total);
      console.log(ev.type + " - " + ev.timeStamp + " - " + ev.currentTarget + " - " + ev.toString() + " - " + ev.loaded);
    }

    httpRequest.onabort = function (ev) {
      responsetime = fetchResponseTime(ev);
      downloadmetadata.set("responseTime", responsetime);
      downloadmetadata.set("responseHeaders", httpRequest.getAllResponseHeaders());

      // Progress interval on abort.
      setProgressPercentage(ev.loaded, ev.total);
      clearInterval(setProgressPercentage);

      console.log(ev.type + " - " + ev.timeStamp + " - " + ev.currentTarget + " - " + ev.toString() + " - " + ev.loaded + " - " + ev.total);
      console.log("Progress on aborting download: ", curProgress.get("progressFloat").toString());

      httpRequest.abort();
    }

    httpRequest.onerror = function (ev) {
      responsetime = fetchResponseTime(ev);
      downloadmetadata.set("responseTime", responsetime);
      downloadmetadata.set("responseHeaders", httpRequest.getAllResponseHeaders());

      // Update progress interval on error.
      setProgressPercentage(ev.loaded, ev.total);
      clearInterval(setProgressPercentage);

      console.log(ev.type + " - " + ev.timeStamp + " - " + ev.currentTarget + " - " + ev.toString() + " - " + ev.loaded);
      console.log("Progress on download error : ", curProgress.get("progressFloat").toString());

      httpRequest.abort();

    }

    // Set on the metadata object.
    let currentTime = ((timestr.getMinutes() * 60) + timestr.getSeconds()) * 1000 - requestStartTime;
    downloadmetadata.set("requestStartTime", currentTime);

    httpRequest.send();
    return httpRequest;

  } catch (e) {
    console.error(logstring.speedTestLogString(timestr) + "Error sending a URLRequest for speedtest download results");
    console.error(e.message.toLocaleString());

    // Remove progress updation.
    clearInterval(setProgressPercentage);
    return downloadmetadata;
  }
}

export {sendURLRequest, requestStartTime, responseTime, downloadmetadata, curProgress, totalSize, setProgressPercentage};
