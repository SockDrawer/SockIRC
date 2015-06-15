'use strict';
const util = require('../util');

const matchers = {
    Fate: {
        matcher: /^([1-9]\d*)dF(ate)?((\+|-)\d+)?$/i,
        parser: (match) => {
            return {
                input: match[0],
                sides: 6,
                count: parseInt(match[1], 10),
                bonus: parseInt(match[3] || '0', 10)
            };
        },
        formatter: (match, dice) => {
            let symbols = dice.map((die) => '[' + ((die < 3) ? '-' : (die > 4) ? '+' : '0') + ']');
            let sum = dice.reduce((partial, die) => partial + ((die < 3) ? -1 : (die > 4) ? 1 : 0), 0);
            let total = sum + match.bonus;
            let calc = '';
            if (match.bonus) {
                calc = ' (' + sum + (match.bonus < 0 ? '' : '+') + match.bonus + ')';
            }
            return '|| ' + symbols.join(' ') + ' || ' + total + calc;
        },
        multiple: false
    },
    DnD: {
        matcher: /^([1-9]\d*)d([1-9]\d*)$/i,
        parser: (match) => {
            return {
                input: match[0],
                sides: parseInt(match[2], 10),
                count: parseInt(match[1], 10)
            };
        },
        formatter: (match, dice) => {
            let rolls = dice.join(', '),
                sum = dice.reduce((partial, die) => partial + die, 0);
            return '|| (' + match.input + ') ' + rolls + ' || ' + sum;
        },
        multiple: true
    }
};
exports.matchers = matchers;

function getMatcher(event) {
    if (!event || !event.command || event.command.toLowerCase() !== '!roll') {
        return undefined;
    }
    let matcher;
    let arg0 = event.args[0];
    Object.keys(matchers).forEach((key) => {
        if (matchers[key].matcher.test(arg0)) {
            matcher = matchers[key];
        }
    });
    return matcher;
}
exports.getMatcher = getMatcher;

function reply(client, event, response) {
    if (event.args) {
        response += ' || ' + event.args.join(' ');
    }
    if (event.type === 'action') {
        client.say(event.reply, event.who + ': ' + response);
    } else {
        client.notice(event.who, response);
    }
    return true;
}
exports.reply = reply;

function rollDice(client, event) {
    const system = getMatcher(event);
    if (!system) {
        return false;
    }
    let result = '';
    while (system.matcher.test(event.args[0])) {
        const arg = event.args.shift(),
            roll = system.parser(system.matcher.exec(arg)),
            dice = getDice(roll.sides, roll.count);
        result += system.formatter(roll, dice);
        if (!system.multiple) {
            break;
        }
        result += ' ';
    }
    if (event.args[0] === '--') {
        event.args.shift();
    }
    return reply(client, event, result.replace(/\s+$/g, ''));
}
exports.rollDice = rollDice;

exports.random = Math.random;

function getDice(sides, count) {
    if (count < 0) {
        count = -count;
    }
    if (count === 0) {
        return [];
    }
    return Array.apply(null, {
        length: count
    }).map(() => Math.floor(exports.random() * sides) + 1);
}
exports.getDice = getDice;

exports.begin = function (client) {
    client.on('message_received', (payload) => rollDice(client, payload));
};

exports.stop = function () {
    util.log('Dice Stopping');
};

exports.defaults = {};
exports.config = {};
