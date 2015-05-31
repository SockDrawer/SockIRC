'use strict';

const fs = require('fs');

const client = require('./client'),
    logger = require('./modules/log2console');
const config = {
    server: 'irc.darkmyst.org',
    nick: 'sockbot',
    channels: ['#crossings_ooc']
};

function loadPlugin(pluginName) {
    let module = (exports.require || require)('./plugins/' + pluginName);
    if (typeof module.begin !== 'function') {
        throw new Error('Plugin ' + pluginName + ' does not export required function `begin(client, config)`');
    }
    if (typeof module.config !== 'object') {
        warn('Plugin ' + pluginName + ' does not define config defaults');
    }
    return module;
}

function readJson(path, callback) {
    (exports.fs || fs).readFile(path, (err, contents) => {
        if (err) {
            return callback(err);
        }
        // Prevent stray BOM from ruining the party.
        if (contents instanceof Buffer) {
            if (contents.length >= 3 && contents[0] === 0xef &&
                contents[1] === 0xbb && contents[2] === 0xbf) {
                contents = contents.slice(3);
            }
        } else if (contents[0] === '\uFEFF') {
            contents = contents.slice(1);
        }
        try {
            callback(null, JSON.parse(contents));
        } catch (e) {
            callback(e);
        }
    });
}

if (require.main === module) {
    // only start the client if running as main mocule
    const events = client.connect(config);
    logger.begin(events);
}

/* eslint-disable no-console */
const log = (output) => (exports.log || console.log)(output),
    warn = (output) => (exports.warn || console.warn)(output);
/* eslint-enable no-console */

if (typeof GLOBAL.describe === 'function') {
    //test is running, export internals to test
    const err = () => {
        throw new Error('i should be overridden in test');
    };
    // export some replacement objects to allow test overriding
    exports.fs = err;
    exports.require = err;
    exports.log = err;
    exports.warn = err;

    exports.readJson = readJson;
    exports.loadPlugin = loadPlugin;

}
