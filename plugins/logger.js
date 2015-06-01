'use strict';

// This is a minimal module to show what the module API is.

const time = () => new Date().toISOString().replace(/^[^T]+T/, '').replace(/[.].*$/, ''),
    log = (actor, target, text) => {
        if (!text) {
            text = target;
            target = '';
        }
        if (target) {
            target = ' => ' + target;
        } else {
            target = '';
        }
        console.log('(' + time() + ') ' + (actor || '') + target + ': ' + text); //eslint-disable-line no-console
    };

// Called when bot starts
exports.begin = (client) => {
    client.on('message_received', (payload) => log(payload.who, payload.what, payload.text));
    client.on('message_sent', (payload) => log(payload.who, payload.what, payload.text));
    client.on('user_action', (payload) => log(payload.who, payload.what, payload.text));
    client.on('channel_action', (payload) => log(payload.who, payload.what, payload.text));
    client.on('error', (payload) => log('ERROR', '', JSON.stringify(payload.raw)));
    setTimeout(() => client.notice('accalia', 'sockbot has connected'), 10000);
};

// Called when bot is exiting
exports.stop = () => {};
