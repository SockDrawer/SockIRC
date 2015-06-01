'use strict';

const client = require('./client'),
    util = require('./util');
const devconfig = {
    server: 'irc.darkmyst.org',
    nick: 'sockbot',
    channels: ['#crossings_ooc'],
    plugins: {
        logger: {}
    }
};

function loadPlugin(pluginName) {
    let module = util.loadModule('./plugins/' + pluginName);
    if (typeof module.begin !== 'function') {
        throw new Error('Plugin ' + pluginName + ' does not export required function `begin(client, config)`');
    }
    if (typeof module.defaults !== 'object') {
        util.warn('Plugin ' + pluginName + ' does not define config defaults');
    }
    return module;
}

function mergeConfig(base, config) {
    const merge = (a, b) => {
        for (let name in b) {
            if (typeof b[name] === 'object' && !Array.isArray(b[name])) {
                a[name] = merge(a[name] || {}, b[name]);
            } else {
                a[name] = b[name];
            }
        }
        return a;
    };
    if (!base) {
        return JSON.parse(JSON.stringify(config));
    }
    base = JSON.parse(JSON.stringify(base));
    return merge(base, config);
}

function loadPlugins(config) {
    const plugins = [];
    if (config.plugins) {
        for (let pluginName in config.plugins) {
            const cfg = config.plugins[pluginName];
            try {
                let plugin = loadPlugin(pluginName);
                plugin.config = mergeConfig(plugin.defaults || {}, cfg);
                plugins.push(plugin);
            } catch (e) {} //eslint-disable-line no-empty
        }
    }
    return plugins;
}

function readJson(path, callback) {
    util.readFile(path, (err, contents) => {
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

/* istanbul ignore if */
if (require.main === module) {
    // only start the client if running as main mocule
    const plugins = loadPlugins(devconfig);
    const events = client.connect(devconfig);
    plugins.forEach((plug) => plug.begin(events));
}

/* istanbul ignore else */
if (typeof GLOBAL.describe === 'function') {
    exports.readJson = readJson;
    exports.loadPlugin = loadPlugin;
    exports.mergeConfig = mergeConfig;
    exports.loadPlugins = loadPlugins;
}
