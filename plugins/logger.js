'use strict';

const util = require('../util');
// This is a minimal module to show what the module API is.

/**
 * Default Configuration Options (will be used as base for exports.config)
 */
exports.defaults = {};
/**
 * Plugin Configuration (will be filled in by the plugin loader based on defaults and file configuration)
 */
exports.config = {};

const time = function (now) {
    now = now || Date.now();
        let date = new Date(now).toISOString();
        return date.replace(/^[^T]+T/, '').replace(/[.].*$/, '');
    },
    log = function (actor, target, text) {
        if (!text) {
            text = target;
            target = '';
        }
        if (target) {
            target = ' => ' + target;
        } else {
            target = '';
        }
        util.log('(' + time() + ') ' + (actor || '') + target + ': ' + text);
    };

/**
 * Called when bot starts. Provides client to the bot to begin interactions
 */
exports.begin = function (client) {
    client.on('message_received', (payload) => log(payload.who, payload.what, payload.text));
    client.on('message_sent', (payload) => log(payload.who, payload.what, payload.text));
    client.on('user_action', (payload) => log(payload.who, payload.what, payload.text));
    client.on('channel_action', (payload) => log(payload.who, payload.what, payload.text));
    client.on('error', (payload) => log('ERROR', '', JSON.stringify(payload.raw)));
    //setTimeout(() => client.notice('accalia', 'sockbot has connected'), 1);
};

/**
 * Called when bot is exiting
 */
exports.stop = function () {};

exports.getTime = time;
exports.logEvent = log;
