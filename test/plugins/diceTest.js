'use strict';

/*globals describe, it*/
/*eslint no-unused-expressions:0 */

const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;

// The thing we're testing
const dice = require('../../plugins/dice'),
    util = require('../../util');

describe('dice', () => {
    describe('exports', () => {
        let fns = ['begin', 'stop', 'getDice', 'getMatcher', 'random', 'reply', 'rollDice'],
            objs = ['defaults', 'matchers', 'config'];
        describe('should export expected functions:', () => {
            fns.forEach((fn) => {
                it(fn + '()', () => expect(dice[fn]).to.be.a('function'));
            });
        });
        describe('should export expected objects', () => {
            objs.forEach((obj) => {
                it(obj, () => expect(dice[obj]).to.be.a('object'));
            });
        });
        it('should export only expected keys', () => {
            dice.should.have.all.keys(fns.concat(objs));
        });
    });

    describe('matchers (keys)', () => {
        ['Fate'].forEach((system) => {
            it('should have a matcher for ' + system + ' dice.', () => {
                expect(dice.matchers[system]).to.be.ok;
            });
            it('should have a regex matcher for ' + system + 'dice', () => {
                expect(dice.matchers[system].matcher).to.be.instanceof(RegExp);
            });
        });
    });
    describe('matchers (Fate)', () => {
        const matcher = dice.matchers.Fate.matcher;
        describe('Test Fate Dice inputs expecting negative match', () => {
            [
                ['arbitrary text', 'nomatch'],
                ['negative dice', '-4dF'],
                ['unrecognized suffix', '4df-nomatch'],
                ['embedded dice 1', 'embed4dF'],
                ['embedded dice 2', '4dFembed'],
                ['embedded dice 3', 'emb4dFed'],
                ['embedded dice 4', '4dembedFate']
            ].forEach((test) => {
                it(test[0] + ' (' + test[1] + ')', () => {
                    expect(matcher.exec(test[1])).to.equal(null);
                });
            });
        });
        describe('Test Fate Dice inputs expecting positive match', () => {
            [
                ['Uppercase', '4dF', ['4', undefined, undefined, undefined]],
                ['Uppercase 2', '4DF', ['4', undefined, undefined, undefined]],
                ['Lowercase', '4df', ['4', undefined, undefined, undefined]],
                ['Lowercase 2', '4Df', ['4', undefined, undefined, undefined]],
                ['Uppercase Long', '4dFate', ['4', 'ate', undefined, undefined]],
                ['Uppercase 2 Long', '4DFate', ['4', 'ate', undefined, undefined]],
                ['Uppercase All Long', '4dFATE', ['4', 'ATE', undefined, undefined]],
                ['Uppercase 2 All Long', '4DFATE', ['4', 'ATE', undefined, undefined]],
                ['Lowercase Long', '4dfate', ['4', 'ate', undefined, undefined]],
                ['Lowercase 2 Long', '4Dfate', ['4', 'ate', undefined, undefined]],
                ['Bonus Uppercase', '4dF+3', ['4', undefined, '+3', '+']],
                ['Bonus Uppercase 2', '4DF+3', ['4', undefined, '+3', '+']],
                ['Bonus Lowercase', '4df+3', ['4', undefined, '+3', '+']],
                ['Bonus Lowercase 2', '4Df+3', ['4', undefined, '+3', '+']],
                ['Bonus Uppercase Long', '4dFate+3', ['4', 'ate', '+3', '+']],
                ['Bonus Uppercase 2 Long', '4DFate+3', ['4', 'ate', '+3', '+']],
                ['Bonus Uppercase All Long', '4dFATE+3', ['4', 'ATE', '+3', '+']],
                ['Bonus Uppercase 2 All Long', '4DFATE+3', ['4', 'ATE', '+3', '+']],
                ['Bonus Lowercase Long', '4dfate+3', ['4', 'ate', '+3', '+']],
                ['Bonus Lowercase 2 Long', '4Dfate+3', ['4', 'ate', '+3', '+']],
                ['Penalty Uppercase', '4dF-3', ['4', undefined, '-3', '-']],
                ['Penalty Uppercase 2', '4DF-3', ['4', undefined, '-3', '-']],
                ['Penalty Lowercase', '4df-3', ['4', undefined, '-3', '-']],
                ['Penalty Lowercase 2', '4Df-3', ['4', undefined, '-3', '-']],
                ['Penalty Uppercase Long', '4dFate-3', ['4', 'ate', '-3', '-']],
                ['Penalty Uppercase 2 Long', '4DFate-3', ['4', 'ate', '-3', '-']],
                ['Penalty Uppercase All Long', '4dFATE-3', ['4', 'ATE', '-3', '-']],
                ['Penalty Uppercase 2 All Long', '4DFATE-3', ['4', 'ATE', '-3', '-']],
                ['Penalty Lowercase Long', '4dfate-3', ['4', 'ate', '-3', '-']],
                ['Penalty Lowercase 2 Long', '4Dfate-3', ['4', 'ate', '-3', '-']]
            ].forEach((test) => {
                it(test[0] + ' (' + test[1] + ')', () => {
                    test[2].unshift(test[1]);
                    (matcher.exec(test[1]) || {}).slice().should.deep.equal(test[2]);
                });
            });
        });
    });
    describe('parsers (Fate)', () => {
        const parser = dice.matchers.Fate.parser;
        describe('parser produces correct output from given inputs', () => {
            [
                [
                    ['4dF', '4', undefined, undefined, undefined], 4, 0
                ],
                [
                    ['7dF+5', '7', undefined, '+5', undefined], 7, 5
                ],
                [
                    ['9dF-6', '9', undefined, '-6', undefined], 9, -6
                ],
                [
                    ['0dF+2', '0', undefined, '+2', undefined], 0, 2
                ],
                [
                    ['-2dF+4', '-2', undefined, '+4', undefined], -2, 4
                ]
            ].forEach((test) => {
                it(JSON.stringify(test[0]).replace(/null/g, 'undefined'), () => {
                    parser(test[0]).should.deep.equal({
                        sides: 6,
                        count: test[1],
                        bonus: test[2]
                    });
                });
            });
        });
    });
    describe('formatters (Fate)', () => {
        const formatter = dice.matchers.Fate.formatter;
        describe('should produce expected output for given input:', () => {
            [
                [
                    [0, 0, 0, 0], 0, '|| [-] [-] [-] [-] || -4'
                ],
                [
                    [1, 1, 1, 1], 1, '|| [-] [-] [-] [-] || -3 (-4+1)'
                ],
                [
                    [0, 1, 0, 1], -1, '|| [-] [-] [-] [-] || -5 (-4-1)'
                ],
                [
                    [0, 0, 0, 0], 7, '|| [-] [-] [-] [-] || 3 (-4+7)'
                ],
                [
                    [3, 3, 3, 3], 0, '|| [0] [0] [0] [0] || 0'
                ],
                [
                    [4, 4, 4, 4], 1, '|| [0] [0] [0] [0] || 1 (0+1)'
                ],
                [
                    [3, 4, 3, 4], -1, '|| [0] [0] [0] [0] || -1 (0-1)'
                ],
                [
                    [4, 3, 3, 4], 7, '|| [0] [0] [0] [0] || 7 (0+7)'
                ],
                [
                    [5, 5, 5, 5], 0, '|| [+] [+] [+] [+] || 4'
                ],
                [
                    [6, 6, 6, 6], 1, '|| [+] [+] [+] [+] || 5 (4+1)'
                ],
                [
                    [5, 6, 5, 6], -1, '|| [+] [+] [+] [+] || 3 (4-1)'
                ],
                [
                    [6, 5, 5, 6], 7, '|| [+] [+] [+] [+] || 11 (4+7)'
                ],
                [
                    [1, 2, 3, 4], 0, '|| [-] [-] [0] [0] || -2'
                ],
                [
                    [2, 3, 5, 6], 0, '|| [-] [0] [+] [+] || 1'
                ]
            ].forEach((test) => {
                it(JSON.stringify(test[0]) + ' + ' + test[1], () => {
                    formatter({
                        bonus: test[1]
                    }, test[0]).should.equal(test[2]);
                });
            });
        });
    });
    describe('getDice()', () => {
        describe('Should produce correct number of dice for requested number of dice: ', () => {
            [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].forEach((d) => {
                it(d + ' dice', () => {
                    expect(dice.getDice(4, d)).to.have.length(Math.abs(d));
                });
            });
        });
        describe('should convert from uniform distribution to dice faces:', () => {
            [
                [0, 1],
                [0.17, 2],
                [0.34, 3],
                [0.51, 4],
                [0.67, 5],
                [0.84, 6]
            ].forEach((test) => {
                dice.random = () => test[0];
                let result = dice.getDice(6, 1);
                dice.random = Math.random;
                it(test[0] + ' => ' + test[1], () => result.should.deep.equal([test[1]]));
            });
        });
    });
    describe('getMatcher()', () => {
        it('should accept null as argument', () => expect(dice.getMatcher(null)).to.be.undefined);
        it('should return undefined on no command', () => expect(dice.getMatcher({
            command: undefined
        })).to.be.undefined);
        it('should return undefined on wrong command', () => expect(dice.getMatcher({
            command: '!logstart'
        })).to.be.undefined);
        it('should return undefined Iroll command witn nonmatching arg', () => expect(dice.getMatcher({
            command: '!roLL',
            args: ['notDiceAtAll']
        })).to.be.undefined);
        const fate = dice.matchers.Fate;
        describe('should select FATE matcher for:', () => {
            ['4dF', '4DFate', '4DF+3', '4dfate+3', '4dF-3', '4DFATE-3'].forEach((test) => {
                it(test, () => dice.getMatcher({
                    command: '!RoLl',
                    args: [test]
                }).should.deep.equal(fate));
            });
        });
    });
    describe('reply()', () => {
        it('should reply privately to non action', () => {
            let client = {
                say: sinon.spy(),
                notice: sinon.spy()
            };
            let event = {
                who: 'foo',
                what: 'bar'
            };
            dice.reply(client, event, 'i am test');
            client.say.called.should.be.false;
            client.notice.called.should.be.true;
            client.notice.lastCall.args.should.deep.equal([event.who, 'i am test']);
        });
        it('should reply publically to action', () => {
            let client = {
                say: sinon.spy(),
                notice: sinon.spy()
            };
            let event = {
                type: 'action',
                who: 'foo',
                reply: 'bar'
            };
            dice.reply(client, event, 'i am test');
            client.say.called.should.be.true;
            client.notice.called.should.be.false;
            client.say.lastCall.args.should.deep.equal([event.reply, 'foo: i am test']);
        });
    });
    describe('rollDice()', () => {
        describe('Should not trigger for negative input conditions', () => {
            [
                ['no command', undefined, undefined],
                ['wrong command', '!foo', undefined],
                ['no dice', '!ROLL', ['nodice']]
            ].forEach((test) => {
                it('should pass on ' + test[0], () => {
                    let client = {
                        say: sinon.spy(),
                        notice: sinon.spy()
                    };
                    let event = {
                        command: test[1],
                        args: test[2]
                    };
                    dice.rollDice(client, event).should.be.false;
                    client.say.called.should.be.false;
                    client.notice.called.should.be.false;
                });
            });
        });
        describe('Should trigger for positive input conditions', () => {
            [
                ['one dice', ['4dF'], /^||( \[.\]){4} || \d+$/],
                ['one dice comment', ['4dF', 'comment'], /^||( \[.\]){4} || \d+ comment$/],
                ['one dice dash comment', ['4dF', '--', 'comment'], /^||( \[.\]){4} || \d+ comment$/],
                ['one fate dice two requested', ['4dF', '4df+3'], /^||( \[.\]){4} || \d+ 4dF\+3$/],
                ['one fate dice dash two requected', ['4dF', '--', '5dF'], /^||( \[.\]){4} || \d+ 5dF$/]
            ].forEach((test) => {
                it('should roll the correct number of dice: ' + test[0], () => {
                    let client = {
                        say: sinon.spy(),
                        notice: sinon.spy()
                    };
                    let event = {
                        command: '!ROLL',
                        args: test[1]
                    };
                    dice.rollDice(client, event).should.be.true;
                    client.notice.called.should.be.true;
                    client.notice.lastCall.args[1].should.match(test[2]);
                });
            });
        });
    });
    describe('begin()', () => {
        let handlers = {},
            client = {
                on: (evt, handler) => handlers[evt] = handler,
                notice: sinon.spy()
            };
        dice.begin(client);
        it('should only register for message_received', () => {
            Object.keys(handlers).should.deep.equal(['message_received']);
        });
        it('should respond to dice roll request', () => {
            handlers.message_received({
                command: '!roll',
                args: ['4dF']
            });
            client.notice.called.should.be.true;
        });
    });
    describe('stop', () => {
        it('should log message on stop', () => {
            const log = util.log,
                spy = sinon.spy();
            util.log = spy;
            dice.stop();
            util.log = log;
            spy.called.should.be.true;
            spy.lastCall.args.should.have.length(1);
            spy.lastCall.args[0].should.equal('Dice Stopping');
        });
    });
});
