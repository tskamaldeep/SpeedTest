'use strict';

let setCurrentInstant = function (timestring) {
  let currenttime = new Map([
    ["minutes", timestring.getMinutes()],
    ["seconds", timestring.getSeconds()],
    ["milliseconds", timestring.getMilliseconds()],
    ["utcseconds", timestring.getUTCSeconds()],
    ["currenttime", timestring]
  ]);

  return currenttime;
};

let speedTestLogString = function (currenttime) {
  return (setCurrentInstant(currenttime).get("currenttime") + " - VimeoSpeedTest: ").toString();
}

export {setCurrentInstant, speedTestLogString};
