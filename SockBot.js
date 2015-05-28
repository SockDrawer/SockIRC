'use strict';

var client = require('./client');

var config = {
    server: 'irc.darkmyst.org',
    nick: 'sockbot',
    channels: ['#crossings_ooc']
};

var time = () => new Date().toISOString().replace(/^[^T]+T/, '').replace(/[.].*$/, ''),
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

var events = client.connect(config);

events.on('message_received', (payload) => log(payload.who, payload.what, payload.text));
events.on('message_sent', (payload) => log(payload.who, payload.what, payload.text));
events.on('user_action', (payload) => log(payload.who, payload.what, payload.text));
events.on('channel_action', (payload) => log(payload.who, payload.what, payload.text));
events.on('error', (payload) => log('ERROR', '', JSON.stringify(payload.raw)));
