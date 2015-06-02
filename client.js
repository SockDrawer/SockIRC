'use strict';
const EventEmitter = require('events').EventEmitter,
    IRCClient = require('irc').Client;

const spaces = /[ \f\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/;

function registerListeners(client, handleit) {
    const handlers = {
        join: (channel, nick, message) => handleit('join', nick, channel, 'joined channel ' + channel, message),
        part: (channel, nick, reason, message) => handleit('part', nick, channel,
            'left channel ' + channel + ' (' + reason + ')', message),
        quit: (nick, reason, message) => handleit('quit', nick, null, 'quit (' + reason + ')', message),
        kick: (channel, nick, by, reason, message) => handleit('kick', by, channel,
            'kicked ' + nick + ' (' + reason + ')', message),
        kill: (nick, reason, _, message) => handleit('kill', nick, null, 'killed (' + reason + ')', message),
        message: (actor, target, text, message) => {
            if (target === client.opt.nick) {
                return;
            }
            handleit('message', actor, target, text, message);
        },
        pm: (actor, text, message) => handleit('pm', actor, client.opt.nick, text, message),
        notice: (nick, target, text, message) => handleit('notice', nick, target, text, message),
        nick: (oldnick, newnick, _, message) => handleit('nick', oldnick, null,
            'changed nickname to ' + newnick, message),
        raw: (message) => handleit('raw', null, null, null, message),
        error: (message) => handleit('error', null, null, null, message),

        action: (nick, target, text, message) => handleit('action', nick, target,
            text, message)
    };

    for (let key of Object.keys(handlers)) {
        client.on(key, handlers[key]);
    }
}

function selectEvent(type) {
    let event = 'unknown';
    if (['message', 'pm', 'notice', 'action'].indexOf(type) >= 0) {
        event = 'message_received';
    } else if (['join', 'part', 'kick'].indexOf(type) >= 0) {
        event = 'channel_action';
    } else if (['quit', 'nick', 'kill'].indexOf(type) >= 0) {
        event = 'user_action';
    } else if (['selfMessage', 'selfNotice', 'selfAction'].indexOf(type) >= 0) {
        event = 'message_sent';
    } else if (['raw', 'error'].indexOf(type) >= 0) {
        event = type;
    }
    return event;
}

function buildEvent(type, who, what, text, raw) {
    let command, args = [];
    text = text || '';
    if (text[0] === '!') {
        args = text.split(spaces);
        command = args.shift();
    }
    return {
        type: type,
        who: who,
        what: what,
        text: text,
        raw: raw,
        command: command,
        args: args
    };
}

function getHandler(emitter) {
    return function handleMessage(type, who, what, text, raw) {
        const event = selectEvent(type),
            payload = buildEvent(type, who, what, text, raw);
        emitter.emit(event, payload);
    };
}

function augmentEvents(events, client) {
    events.say = (target, text) => {
        const payload = buildEvent('selfMessage', client.opt.nick, target, text, {});
        const event = selectEvent('selfMessage');
        client.say(target, text);
        events.emit(event, payload);
    };
    events.notice = (target, text) => {
        const payload = buildEvent('selfNotice', client.opt.nick, target, text, {});
        const event = selectEvent('selfNotice');
        client.notice(target, text);
        events.emit(event, payload);
    };
    events.action = (target, action) => {
        const payload = buildEvent('selfAction', client.opt.nick, target, action, {});
        const event = selectEvent('selfAction');
        client.action(target, action);
        events.emit(event, payload);
    };
    events.join = (target) => client.join(target);
    events.part = (target, reason) => client.part(target, reason);
}

function connect(config) {
    const events = new EventEmitter(),
        client = new IRCClient(config.server, config.nick, {
            channels: config.channels,
            userName: config.nick,
            realName: config.nick,
            password: config.password,
            floodProtection: true,
            autoConnect: false
        }),
        handler = getHandler(events);
    registerListeners(client, handler);
    augmentEvents(events, client);
    /* istanbul ignore else */
    if (typeof GLOBAL.describe === 'function') {
        // expose client when in test mode
        events.client = client;
    } else {
        // do not connect client in test mode.
        client.connect();
    }
    return events;
}

exports.connect = connect;
/* istanbul ignore else */
if (typeof GLOBAL.describe === 'function') {
    //test is running
    exports.registerListeners = registerListeners;
    exports.selectEvent = selectEvent;
    exports.buildEvent = buildEvent;
    exports.getHandler = getHandler;
    exports.augmentEvents = augmentEvents;
}
