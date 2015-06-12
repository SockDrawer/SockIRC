'use strict';


exports.join = function join(client, event) {
    const channel = event.args.shift();
    if (event.args[0] === '--') {
        event.args.shift();
    }
    const message = event.args.join(' ');
    client.join(channel, () => {
        if (message) {
            client.say(channel, message);
        }
    });
};
exports.part = function part(client, event) {
    const channel = event.args.shift();
    if (event.args[0] === '--') {
        event.args.shift();
    }
    const message = event.args.join(' ');
    if (message) {
        client.say(channel, message);
    }
    client.part(channel);
};

exports.process = function (client, event) {
    if (!event.command) {
        return false;
    }
    let processor = exports.commands[event.command];
    if (!processor) {
        return false;
    }
    processor(client, event);
    event.command = undefined;
    event.args = [];
    return true;
};

exports.commands = {
    '!join': exports.join,
    '!part': exports.part
};

