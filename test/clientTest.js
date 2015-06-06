'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */
const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;
// The thing we're testing
const client = require('../client'),
    EventEmitter = require('events').EventEmitter,
    IRCClient = require('irc').Client;

describe('client', () => {
    const messages = {
        message: 'message_received',
        pm: 'message_received',
        notice: 'message_received',
        action: 'message_received',
        join: 'channel_action',
        part: 'channel_action',
        kick: 'channel_action',
        quit: 'user_action',
        nick: 'user_action',
        kill: 'user_action',
        selfMessage: 'message_sent',
        selfNotice: 'message_sent',
        selfAction: 'message_sent',
        raw: 'raw',
        error: 'error',
        badMessage: 'unknown'
    };
    describe('test mode exports', () => {
        const fns = ['connect', 'registerListeners', 'buildEvent', 'selectEvent', 'getHandler', 'augmentEvents'];
        fns.forEach((fn) => it('should expose ' + fn, () => expect(client[fn]).to.be.a('function')));
    });
    const rawMessage = {
        'message': 'foo'
    };
    describe('registerListeners()', () => {
        const events = {
            'join': {
                args: ['channel', 'nickname', rawMessage],
                expect: ['join', 'nickname', 'channel', 'joined channel channel', rawMessage]
            },
            'part': {
                args: ['channel', 'nickname', 'reason', rawMessage],
                expect: ['part', 'nickname', 'channel', 'left channel channel (reason)', rawMessage]
            },
            'quit': {
                args: ['nickname', 'reason', rawMessage],
                expect: ['quit', 'nickname', null, 'quit (reason)', rawMessage]
            },
            'kick': {
                args: ['channel', 'nickname1', 'nickname2', 'reason', rawMessage],
                expect: ['kick', 'nickname2', 'channel', 'kicked nickname1 (reason)', rawMessage]
            },
            'kill': {
                args: ['nickname', 'reason', undefined, rawMessage],
                expect: ['kill', 'nickname', null, 'killed (reason)', rawMessage]
            },
            'message': {
                args: ['nickname', 'channel', 'text', rawMessage],
                expect: ['message', 'nickname', 'channel', 'text', rawMessage]
            },
            'pm': {
                args: ['nickname', 'text', rawMessage],
                expect: ['pm', 'nickname', 'testbot', 'text', rawMessage]
            },
            'notice': {
                args: ['nickname', 'channel', 'text', rawMessage],
                expect: ['notice', 'nickname', 'channel', 'text', rawMessage]
            },
            'nick': {
                args: ['nickname1', 'nickname2', undefined, rawMessage],
                expect: ['nick', 'nickname1', null, 'changed nickname to nickname2', rawMessage]
            },
            'raw': {
                args: [rawMessage],
                expect: ['raw', null, null, null, rawMessage]
            },
            'error': {
                args: [rawMessage],
                expect: ['error', null, null, null, rawMessage]
            },
            'action': {
                args: ['nickname', 'channel', 'text', rawMessage],
                expect: ['action', 'nickname', 'channel', 'text', rawMessage]
            }
        };
        Object.keys(events).forEach((event) => {
            const handles = {};
            client.registerListeners({
                opt: {
                    nick: 'testbot'
                },
                on: (e, fn) => handles[e] = fn
            }, (event_, who, what, text, raw) => {
                [event_, who, what, text, raw].should.deep.equal(events[event].expect);
            });
            it('should register ' + event + ' handler', () => {
                handles.should.have.property(event);
            });
            it('should map ' + event + ' arguments correctly', () => {
                handles[event].apply(this, events[event].args);
            });
        });
        it('should not propagate at message directed at bot (should use PM instead)', () => {
            const spy = sinon.spy(),
                handles = {};
            client.registerListeners({
                opt: {
                    nick: 'testbot'
                },
                on: (e, fn) => handles[e] = fn
            }, spy);
            spy.called.should.be.false;
            handles.message('user', 'testbot');
            spy.called.should.be.false;
        });
    });
    describe('selectEvent()', () => {
        Object.keys(messages).forEach((type) => {
            const event = messages[type];
            it('should select ' + event + ' event for ' + type + ' message', () => {
                expect(client.selectEvent(type)).to.equal(event);
            });
        });
    });
    describe('buildEvent()', () => {
        it('should generate correct properties from buildEvent', () => {
            const keys = ['type', 'who', 'what', 'reply', 'text', 'raw', 'command', 'args'];
            const result = client.buildEvent('test', 'test', 'test', 'test', rawMessage);
            Object.keys(result).should.deep.equal(keys);
        });
        it('should map arguments to buildEvent correctly', () => {
            const expected = {
                type: 'test',
                who: 'test2',
                what: 'test3',
                text: 'text',
                raw: rawMessage,
                command: undefined,
                args: [],
                reply: 'test3'
            };
            let result = client.buildEvent('test', 'test2', 'test3', 'text', rawMessage);
            result.should.deep.equal(expected);
        });
        it('should map pm arguments to buildEvent correctly', () => {
            const expected = {
                type: 'pm',
                who: 'test2',
                what: 'test3',
                text: 'text',
                raw: rawMessage,
                command: undefined,
                args: [],
                reply: 'test2'
            };
            let result = client.buildEvent('pm', 'test2', 'test3', 'text', rawMessage);
            result.should.deep.equal(expected);
        });
        it('should not generate command for non command text', () => {
            let result = client.buildEvent('type', 'who', 'what', 'some text', {});
            expect(result.command).to.be.undefined;
            expect(result.args).to.have.length(0);
        });
        it('should generate command for command text', () => {
            let result = client.buildEvent('type', 'who', 'what', '!command', {});
            expect(result.command).to.equal('!command');
            expect(result.args).to.have.length(0);
        });
        it('should generate arguments for command with arguments', () => {
            let result = client.buildEvent('type', 'who', 'what', '!command with many arguments', {});
            expect(result.command).to.equal('!command');
            expect(result.args).to.deep.equal(['with', 'many', 'arguments']);
        });
        it('should accept `null` for text argument', () => {
            let result = client.buildEvent('type', 'who', 'what', null, {});
            expect(result.text).to.equal('');
        });
        it('should accept `undefined` for text argument', () => {
            let result = client.buildEvent('type', 'who', 'what', undefined, {});
            expect(result.text).to.equal('');
        });
        const spaces = [' ', '\f', '\r', '\t', '\v', '\u00a0', '\u1680', '\u180e', '\u2000', '\u2001', '\u2002',
            '\u2003', '\u2004', '\u2005', '\u2006', '\u2007', '\u2008', '\u2009', '\u200a', '\u2028', '\u2029',
            '\u202f', '\u205f', '\u3000'
        ];
        const codepoint = (a) => {
            let res = ('0000' + a.charCodeAt().toString(16));
            return '\\u' + res.substring(res.length - 4);
        };
        spaces.forEach((space) => {
            let str = codepoint(space);
            it('should split arguments on ' + str + ' character', () => {
                let result = client.buildEvent('type', 'who', 'what', '!command a' + space + 'b', {});
                expect(result.args).to.deep.equal(['a', 'b']);
            });
        });
        it('should not split arguments on \\n character', () => {
            let result = client.buildEvent('type', 'who', 'what', '!command a\nb', {});
            expect(result.args).to.deep.equal(['a\nb']);
        });
    });
    describe('getHandler()', () => {
        it('should return a function when invoked', () => expect(client.getHandler(null)).to.be.a('function'));
        Object.keys(messages).forEach((message) => {
            let event = messages[message],
                emitter = {
                    emit: (evt, payload) => {
                        it('should emit ' + event + ' on message ' + message, () => {
                            evt.should.equal(event);
                            payload.should.be.a('object');
                            expect(payload.type).to.equal(message);
                        });
                    }
                },
                handler = client.getHandler(emitter);
            handler(message, null, null, null, {});
        });
    });
    describe('augmentEvents()', () => {
        const spies = {
                say: sinon.spy(),
                notice: sinon.spy(),
                action: sinon.spy(),
                join: sinon.spy(),
                part: sinon.spy(),
                opt: {
                    nick: 'testbot'
                }
            },
            emitter = {
                emit: sinon.spy()
            },
            props = ['say', 'notice', 'action', 'join', 'part'];
        client.augmentEvents(emitter, spies);
        it('should have augmented keys', () => emitter.should.have.all.keys(props.concat(['emit'])));
        props.forEach((prop) => {
            it('emitter.' + prop + ' should proxy to client.' + prop, () => {
                expect(spies[prop].called).to.be.false;
                emitter[prop]('target', 'text');
                expect(spies[prop].called).to.be.true;
                if (prop === 'join') {
                    // join only takes one parameter
                    expect(spies[prop].calledWithExactly('target')).to.be.true;
                } else {
                    expect(spies[prop].calledWithExactly('target', 'text')).to.be.true;
                }
                spies[prop].reset();
            });
        });
        [
            ['say', 'message_sent', 'selfMessage'],
            ['notice', 'message_sent', 'selfNotice'],
            ['action', 'message_sent', 'selfAction']
        ].forEach((arg) => {
            const prop = arg[0],
                message = arg[1],
                type = arg[2];
            emitter.emit.reset();
            it('should emit ' + message + ' on ' + prop, () => {
                emitter[prop]('target', 'text');
                emitter.emit.called.should.be.true;
                let call = emitter.emit.lastCall;
                call.args.should.have.length(2);
                call.args[0].should.equal(message);
                call.args[1].type.should.equal(type);
            });
        });
    });
    describe('connect()', () => {
        const config = {
                server: 'irc.example.org',
                nick: 'testbot',
                channels: ['#testchannel']
            },
            emitter = client.connect(config),
            props = ['say', 'notice', 'action', 'join', 'part'];
        it('should return an event emitter', () => emitter.should.be.instanceof(EventEmitter));
        props.forEach((prop) => it('emmiter.' + prop + ' should be a function', () => {
            expect(emitter[prop]).to.be.a('function');
        }));
        it('should expose IRC client in test mode', () => expect(emitter.client).to.be.instanceof(IRCClient));
        it('should activate floodProtection', () => emitter.client.opt.floodProtection.should.be.true);
        it('should not autoConnect', () => emitter.client.opt.autoConnect.should.be.false);
        it('should set userName', () => emitter.client.opt.userName.should.equal(config.nick));
        it('should set realName', () => emitter.client.opt.realName.should.equal(config.nick));
    });
});
