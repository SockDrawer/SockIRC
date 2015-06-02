'use strict';
const fs = require('fs');
const readFile = fs.readFile;

function log(message) {
    console.log(message); //eslint-disable-line no-console
}

function warn(message) {
    console.warn(message); //eslint-disable-line no-console
}

function error(message) {
    console.error(message); //eslint-disable-line no-console
}

function loadModule(path) {
    require(path);
}
exports.log = log;
exports.warn = warn;
exports.error = error;
exports.readFile = readFile;
exports.loadModule = loadModule;
exports.reset = function reset() {
    exports.log = log;
    exports.warn = warn;
    exports.error = error;
    exports.readFile = readFile;
    exports.loadModule = loadModule;
};
