'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */

const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;

// The thing we're testing
const SockBot = require('../SockBot');

describe('SockBot', () => {
    describe('test mode exports', () => {
        const fns = ['fs', 'readJson', 'loadPlugin', 'require', 'log', 'warn'];
        fns.forEach((fn) => it('should expose ${fn}()', () => expect(SockBot[fn]).to.be.a('function')));
    });
    describe('readJson()', () => {
        it('should fail load when readFile errors', (done) => {
            SockBot.fs.readFile = (_, cb) => cb('this is test error');
            SockBot.readJson('test/path/that/does/not/exist', (err, json) => {
                expect(err).to.equal('this is test error');
                expect(json).to.be.undefined;
                done();
            });
        });
        it('should fail load when readFile returns invalid json', (done) => {
            SockBot.fs.readFile = (_, cb) => cb(null, '{ not: json]');
            SockBot.readJson('test/path/that/does/not/exist', (err, json) => {
                expect(err).to.be.instanceof(Error);
                err.message.should.equal('Unexpected token n');
                expect(json).to.be.undefined;
                done();
            });
        });
        const target = {
            a: 1,
            b: 2,
            c: {
                target: 4
            }
        };

        const BOM = new Buffer([0xef, 0xbb, 0xbf]),
            minstr = JSON.stringify(target),
            spacestr = JSON.stringify(target, undefined, '    '),
            tabstr = JSON.stringify(target, undefined, '\t');
        [
            ['should load string minimized JSON', minstr],
            ['should load string space indented JSON', spacestr],
            ['should load string tab indented JSON', tabstr],
            ['should load string minimized JSON with UTF8 BOM', '\uFEFF' + minstr],
            ['should load string space indented JSON with UTF8 BOM', '\uFEFF' + spacestr],
            ['should load string tab indented JSON with UTF8 BOM', '\uFEFF' + tabstr],
            ['should load Buffer minimized JSON', new Buffer(minstr)],
            ['should load Buffer space indented JSON', new Buffer(spacestr)],
            ['should load Buffer tab indented JSON', new Buffer(tabstr)],
            ['should load Buffer minimized JSON with UTF8 BOM', Buffer.concat([BOM, new Buffer(minstr)])],
            ['should load Buffer space indented JSON with UTF8 BOM', Buffer.concat([BOM, new Buffer(spacestr)])],
            ['should load Buffer tab indented JSON with UTF8 BOM', Buffer.concat([BOM, new Buffer(tabstr)])]
        ].forEach((arg) => {
            const title = arg[0],
                res = arg[1];
            it(title, (done) => {
                SockBot.fs.readFile = (_, cb) => cb(null, res);
                SockBot.readJson('test/path/that/does/not/exist', (err, json) => {
                    expect(err).to.be.null;
                    expect(json).to.deep.equal(target);
                    done();
                });
            });
        });
    });
    describe('loadPlugin()', () => {
        SockBot.log = sinon.spy();
        SockBot.warn = sinon.spy();
        it('should propagate exception when plugin fails load', () => {
            SockBot.log.reset();
            SockBot.warn.reset();
            SockBot.require = () => {
                throw new Error('Require Test Error');
            };
            expect(() => SockBot.loadPlugin('badplugin')).to.throw(Error, 'Require Test Error');
            SockBot.log.called.should.be.false;
            SockBot.warn.called.should.be.false;
        });
        it('should throw exception when plugin does not export begin()', () => {
            const error = 'Plugin badplugin does not export required function `begin(client, config)`';
            SockBot.log.reset();
            SockBot.warn.reset();
            SockBot.require = () => {
                return {};
            };
            expect(() => SockBot.loadPlugin('badplugin')).to.throw(Error, error);
            SockBot.log.called.should.be.false;
            SockBot.warn.called.should.be.false;
        });
        it('should write warning plugin does not export defaults', () => {
            const error = 'Plugin badplugin does not define config defaults';
            SockBot.log.reset();
            SockBot.warn.reset();
            SockBot.require = () => {
                return {
                    begin: () => 0
                };
            };
            SockBot.loadPlugin('badplugin');
            SockBot.log.called.should.be.false;
            SockBot.warn.called.should.be.true;
            SockBot.warn.lastCall.args.should.deep.equal([error]);
        });
        it('should load valid plugin without warnings', () => {
            const plugin = {
                begin: () => 0,
                config: {}
            };
            SockBot.log.reset();
            SockBot.warn.reset();
            SockBot.require = () => plugin;
            expect(SockBot.loadPlugin('badplugin')).to.deep.equal(plugin);
            SockBot.log.called.should.be.false;
            SockBot.warn.called.should.be.false;
        });
    });
});
