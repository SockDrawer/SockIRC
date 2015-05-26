'use strict';

var irc = require('irc'),
    events = require('events');

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


exports.connect = () => {
    var eventEmitter = new events.EventEmitter(),
        client = new irc.Client('irc.darkmyst.org', 'sockbot', {
            channels: ['#crossings_ooc']
        }),
        handleit = (event, nick, target, text, message) => {
            if (event !== 'raw') {
                log(nick, target, text);
            }
            eventEmitter.emit(event, nick, target, text, message);
        },
        handlers = {
            motd: (motd) => handleit('motd', null, null, motd, {}),
            topic: (channel, topic, nick, message) => handleit('topic', nick, channel, topic, message),
            join: (channel, nick, message) => handleit('join', nick, channel, 'joined channel ' + channel, message),
            part: (channel, nick, reason, message) => handleit('part', nick, channel,
                'left channel ' + channel + ' (' + reason + ')', message),
            quit: (nick, reason, message) => handleit('quit', nick, null, 'quit (' + reason + ')', message),
            kick: (channel, nick, by, reason, message) => handleit('kick', by, channel,
                'kicked ' + nick + ' (' + reason + ')', message),
            kill: (nick, reason, _, message) => handleit('kill', nick, null, 'killed (' + reason + ')', message),
            message: (actor, target, text, message) => {
                if (target === 'sockbot') {
                    return;
                }
                handleit('message', actor, target, text, message);
            },
            pm: (actor, text, message) => handleit('pm', actor, 'ME', text, message),
            selfMessage: (target, text) => handleit('selfMessage', 'ME', target, text, {}),
            notice: (nick, target, text, message) => handleit('notice', nick, target, text, message),
            nick: (oldnick, newnick, _, message) => handleit('nick', oldnick, null,
                'changed nickname to ' + newnick, message),
            raw: (message) => handleit('raw', null, null, null, message),
            error: (message) => handleit('error', null, null, null, message),
            action: (nick, target, text, message) => handleit('action', nick, target,
                '*' + nick + '*: ' + text, message)
        };

    for (let key of Object.keys(handlers)) {
        client.on(key, handlers[key]);
    }
    return eventEmitter;
};
exports.connect();