'use strict';
const fs = require('fs');
const log = (message) => console.log(message), //eslint-disable-line no-console
    warn = (message) => console.warn(message), //eslint-disable-line no-console
    error = (message) => console.error(message), //eslint-disable-line no-console
    readFile = fs.readFile,
    loadModule = (path) => require(path);
exports.log = log;
exports.warn = warn;
exports.error = error;
exports.readFile = readFile;
exports.loadModule = loadModule;
exports.reset = () => {
    exports.log = log;
    exports.warn = warn;
    exports.error = error;
    exports.readFile = readFile;
    exports.loadModule = loadModule;
};
