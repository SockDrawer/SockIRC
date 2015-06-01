'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */

const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;

// The thing we're testing
const logger = require('../../plugins/logger'),
    util = require('../../util');

const timeMatch = /^\(\d\d:\d\d:\d\d\) /;

describe('logger', () => {
    describe('module exports', () => {
        ['begin', 'stop', 'getTime', 'logEvent'].forEach((fn) => {
            it('should export ' + fn + '()', () => expect(logger[fn]).to.be.a('function'));
        });
        ['defaults', 'config'].forEach((obj) => {
            it('should export ' + obj, () => expect(logger[obj]).to.be.a('object'));
        });
    });
    describe('getTime()', () => {
        it('should accept timestamp for date', () => {
            logger.getTime(1433164464822).should.equal('13:14:24');
            logger.getTime(1).should.equal('00:00:00');
        });
        it('should produce correct timestamp format', () => {
            logger.getTime().should.match(/^\d\d:\d\d:\d\d$/);
        });
    });
    describe('stop()', () => {
        it('should be a noop', () => {
            expect(() => logger.stop()).to.not.throw();
        });
    });
    describe('logEvent()', () => {
        util.log = sinon.spy();

        it('should call util.log to log data', () => {
            logger.logEvent(undefined, undefined, 'this is log message');
            util.log.called.should.be.true;
            util.log.lastCall.args.should.have.length(1);
            let arg = util.log.lastCall.args[0];
            arg.should.match(timeMatch);
            arg.replace(timeMatch, '').should.equal(': this is log message');
        });
        [
            ['no target', undefined, 'I don\'t specify a target', undefined, ': I don\'t specify a target'],
            ['target+text', undefined, 'target', 'text', ' => target: text'],
            ['actor+text', 'actor', undefined, 'text', 'actor: text'],
            ['all arguments', 'actor', 'target', 'text', 'actor => target: text'],
            ['no arguments', undefined, undefined, undefined, ': undefined']
        ].forEach((row) => {
            it('should generate correct output with ' + row[0], () => {
                logger.logEvent(row[1], row[2], row[3]);
                let arg = util.log.lastCall.args[0];
                arg.replace(timeMatch, '').should.equal(row[4]);
            });
        });
    });
    describe('begin()', () => {
        ['message_received', 'message_sent', 'user_action', 'channel_action', 'error'].forEach((event) => {
            it('should register event: ' + event, () => {
                const evts = [];
                logger.begin({
                    on: (evt) => evts.push(evt),
                    notice: () => 0
                });
                evts.should.include(event);
            });
        });
        const events = {},
            client = {
                on: (evt, handler) => events[evt] = handler,
                notice: () => 0
            },
            spy = sinon.spy();

        logger.begin(client);
        [
            ['message_received', {
                who: 'avatar1',
                what: '#channel1',
                text: 'message1'
            }, 'avatar1 => #channel1: message1'],
            ['message_sent', {
                who: 'avatar2',
                what: '#channel2',
                text: 'message2'
            }, 'avatar2 => #channel2: message2'],
            ['user_action', {
                who: 'avatar3',
                what: '#channel3',
                text: 'message3'
            }, 'avatar3 => #channel3: message3'],
            ['channel_action', {
                who: 'avatar4',
                what: '#channel4',
                text: 'message4'
            }, 'avatar4 => #channel4: message4'],
            ['error', {
                raw: {
                    a: 0
                }
            }, 'ERROR: {"a":0}']
        ].forEach((event) => {
            it('should log expected message for event ' + event[0], () => {
                util.log = spy;
                events[event[0]](event[1]);
                spy.called.should.be.true;
                spy.lastCall.args.should.have.length(1);
                spy.lastCall.args[0].replace(timeMatch, '').should.equal(event[2]);
            });
        });
    });
});
