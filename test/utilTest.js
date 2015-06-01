'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */

const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;

// The thing we're testing
const util = require('../util');


describe('util', () => {
    util.reset();
    describe('exports', () => {
        const fns = ['readFile', 'loadModule', 'log', 'warn'];
        fns.forEach((fn) => it('should expose ' + fn + '()', () => expect(util[fn]).to.be.a('function')));
    });
    describe('log()', () => {
        it('should call console.log with provided message', () => {
            let log = console.log, //eslint-disable-line no-console
                spy = sinon.spy();
            util.reset();
            console.log = spy; //eslint-disable-line no-console
            util.log('test message 1');
            console.log = log; //eslint-disable-line no-console
            spy.called.should.be.true;
            spy.lastCall.args.should.deep.equal(['test message 1']);
        });
    });
    describe('warn()', () => {
        it('should call console.warn with provided message', () => {
            let log = console.warn, //eslint-disable-line no-console
                spy = sinon.spy();
            util.reset();
            console.warn = spy; //eslint-disable-line no-console
            util.warn('test message 2');
            console.warn = log; //eslint-disable-line no-console
            spy.called.should.be.true;
            spy.lastCall.args.should.deep.equal(['test message 2']);
        });
    });
    describe('readFile()', () => {
        it('should be fs.readFile()', () => {
            util.reset();
            const fs = require('fs');
            fs.readFile.should.equal(util.readFile);
        });
    });
    describe('loadModule()', () => {
        it('should throw on load of unknown path', () => {
            expect(() => util.loadModule('notamodule')).to.throw(Error, 'Cannot find module \'notamodule\'');
        });
    });
});
