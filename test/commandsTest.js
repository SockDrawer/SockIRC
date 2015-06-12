'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */
const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;
// The thing we're testing
const commands = require('../commands');

describe('client', () => {
    describe('exports', () => {
        let fns = ['join', 'part', 'process'],
            objs = ['commands'];
        describe('should export expected functions:', () => {
            fns.forEach((fn) => {
                it(fn + '()', () => expect(commands[fn]).to.be.a('function'));
            });
        });
        describe('should export expected objects', () => {
            objs.forEach((obj) => {
                it('should export ' + obj, () => expect(commands[obj]).to.be.a('object'));
            });
        });
        it('should export only expected keys', () => {
            commands.should.have.all.keys(fns.concat(objs));
        });
    });
    describe('join()', () => {
        it('should emit client join', () => {
            let client = {
                    join: sinon.spy((_, fn) => !!fn && fn()),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar']
                };
            commands.join(client, event);
            client.join.called.should.be.true;
            client.join.lastCall.args.should.have.length(2);
            client.join.lastCall.args[0].should.equal('#foobar');
            client.say.called.should.be.false;
        });
        it('should emit client.say when provided with message', () => {
            let client = {
                    join: sinon.spy((_, fn) => !!fn && fn()),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar', 'hello', 'there']
                };
            commands.join(client, event);
            client.join.called.should.be.true;
            client.say.called.should.be.true;
            client.say.lastCall.args.should.have.length(2);
            client.say.lastCall.args.should.deep.equal(['#foobar', 'hello there']);
        });
        it('should ignore arg terminating `--`', () => {
            let client = {
                    join: sinon.spy((_, fn) => !!fn && fn()),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar', '--', 'hello', 'there']
                };
            commands.join(client, event);
            client.join.called.should.be.true;
            client.say.called.should.be.true;
            client.say.lastCall.args.should.have.length(2);
            client.say.lastCall.args.should.deep.equal(['#foobar', 'hello there']);
        });
    });
    describe('part()', () => {
        it('should emit client part', () => {
            let client = {
                    part: sinon.spy(),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar']
                };
            commands.part(client, event);
            client.say.called.should.be.false;
            client.part.called.should.be.true;
            client.part.lastCall.args.should.have.length(1);
            client.part.lastCall.args[0].should.equal('#foobar');
        });
        it('should emit client part with message', () => {
            let client = {
                    part: sinon.spy(),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar', 'goodbye', 'all']
                };
            commands.part(client, event);
            client.say.called.should.be.true;
            client.say.lastCall.args.should.deep.equal(['#foobar', 'goodbye all']);
            client.part.called.should.be.true;
            client.part.lastCall.args.should.deep.equal(['#foobar']);
        });
        it('should ignore arg terminating `--`', () => {
            let client = {
                    part: sinon.spy(),
                    say: sinon.spy()
                },
                event = {
                    args: ['#foobar', '--', 'goodbye', 'all']
                };
            commands.part(client, event);
            client.say.called.should.be.true;
            client.say.lastCall.args.should.deep.equal(['#foobar', 'goodbye all']);
            client.part.called.should.be.true;
            client.part.lastCall.args.should.deep.equal(['#foobar']);
        });
    });
    describe('process()', () => {
        it('should not process non command', () => {
            let join = sinon.stub(commands.commands, '!join');
            let part = sinon.stub(commands.commands, '!part');
            let result = commands.process(null, {
                command: undefined
            });
            result.should.be.false;
            join.called.should.be.false;
            part.called.should.be.false;
            join.restore();
            part.restore();
        });
        it('should not process unrecognized command', () => {
            const command = '!dance';
            commands.commands.should.not.have.any.key(command);
            let join = sinon.stub(commands.commands, '!join');
            let part = sinon.stub(commands.commands, '!part');
            let result = commands.process(null, {
                command: command
            });
            result.should.be.false;
            join.called.should.be.false;
            part.called.should.be.false;
            join.restore();
            part.restore();
        });
        it('should process join command', () => {
            const command = '!join';
            commands.commands.should.have.any.key(command);
            let join = sinon.stub(commands.commands, '!join');
            let part = sinon.stub(commands.commands, '!part');
            let client = {
                    thingy: 42
                },
                event = {
                    command: command
                };
            let result = commands.process(client, event);
            result.should.be.true;
            join.called.should.be.true;
            join.lastCall.args.should.deep.equal([client, event]);
            part.called.should.be.false;
            join.restore();
            part.restore();
        });
        it('should process part command', () => {
            const command = '!part';
            commands.commands.should.have.any.key(command);
            let join = sinon.stub(commands.commands, '!join');
            let part = sinon.stub(commands.commands, '!part');
            let client = {
                    thingy: 42
                },
                event = {
                    command: command
                };
            let result = commands.process(client, event);
            result.should.be.true;
            join.called.should.be.false;
            part.called.should.be.true;
            part.lastCall.args.should.deep.equal([client, event]);
            join.restore();
            part.restore();
        });
        it('should unset command when processing command', () => {
            const command = '!part';
            commands.commands.should.have.any.key(command);
            let part = sinon.stub(commands.commands, '!part');
            let event = {
                command: command
            };
            let result = commands.process(null, event);
            result.should.be.true;
            expect(event.command).to.equal(undefined);
            event.args.should.deep.equal([]);
            part.restore();
        });
    });
});
