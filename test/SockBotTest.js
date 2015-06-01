'use strict';
/*globals describe, it*/
/*eslint no-unused-expressions:0 */

const chai = require('chai'),
    sinon = require('sinon');
chai.should();
const expect = chai.expect;

// The thing we're testing
const SockBot = require('../SockBot'),
    util = require('../util');

describe('SockBot', () => {
    util.reset();
    describe('test mode exports', () => {
        const fns = ['readJson', 'loadPlugin', 'loadPlugins', 'mergeConfig'];
        fns.forEach((fn) => it('should expose ' + fn + '()', () => expect(SockBot[fn]).to.be.a('function')));

    });
    describe('readJson()', () => {
        it('should fail load when readFile errors', (done) => {
            util.readFile = (_, cb) => cb('this is test error');
            SockBot.readJson('test/path/that/does/not/exist', (err, json) => {
                expect(err).to.equal('this is test error');
                expect(json).to.be.undefined;
                done();
            });
        });
        it('should fail load when readFile returns invalid json', (done) => {
            util.readFile = (_, cb) => cb(null, '{ not: json]');
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
                util.readFile = (_, cb) => cb(null, res);
                SockBot.readJson('test/path/that/does/not/exist', (err, json) => {
                    expect(err).to.be.null;
                    expect(json).to.deep.equal(target);
                    done();
                });
            });
        });
    });
    describe('loadPlugin()', () => {
        it('should propagate exception when plugin fails load', () => {
            util.log = sinon.spy();
            util.warn = sinon.spy();
            util.loadModule = () => {
                throw new Error('Require Test Error');
            };
            expect(() => SockBot.loadPlugin('badplugin')).to.throw(Error, 'Require Test Error');
            util.log.called.should.be.false;
            util.warn.called.should.be.false;
        });
        it('should throw exception when plugin does not export begin()', () => {
            const error = 'Plugin badplugin does not export required function `begin(client, config)`';
            util.log = sinon.spy();
            util.warn = sinon.spy();
            util.loadModule = () => {
                return {};
            };
            expect(() => SockBot.loadPlugin('badplugin')).to.throw(Error, error);
            util.log.called.should.be.false;
            util.warn.called.should.be.false;
        });
        it('should write warning plugin does not export defaults', () => {
            const error = 'Plugin badplugin does not define config defaults';
            util.log = sinon.spy();
            util.warn = sinon.spy();
            util.loadModule = () => {
                return {
                    begin: () => 0
                };
            };
            SockBot.loadPlugin('badplugin');
            util.log.called.should.be.false;
            util.warn.called.should.be.true;
            util.warn.lastCall.args.should.deep.equal([error]);
        });
        it('should load valid plugin without warnings', () => {
            const plugin = {
                begin: () => 0,
                defaults: {}
            };
            util.log = sinon.spy();
            util.warn = sinon.spy();
            util.loadModule = () => plugin;
            expect(SockBot.loadPlugin('badplugin')).to.deep.equal(plugin);
            util.log.called.should.be.false;
            util.warn.called.should.be.false;
        });
    });
    describe('mergeConfig()', () => {
        it('should return copy of config when base is null', () => {
            const cfg = {
                a: 1,
                b: 2,
                c: {
                    d: 4,
                    e: [1, 2, 3]
                }
            };
            const result = SockBot.mergeConfig(null, cfg);
            cfg.should.deep.equal(result);
            result.z = 1;
            cfg.should.not.deep.equal(result);
        });
        it('should return copy of config when base is undefined', () => {
            const cfg = {
                a: 1,
                b: 2,
                c: {
                    d: 4,
                    e: [1, 2, 3]
                }
            };
            const result = SockBot.mergeConfig(undefined, cfg);
            cfg.should.deep.equal(result);
            result.z = 1;
            cfg.should.not.deep.equal(result);
        });
        it('should return merged config when base simple object', () => {
            const cfg = {
                    a: 1,
                    b: 2,
                    c: 3
                },
                base = {
                    z: 1
                },
                expected = {
                    z: 1,
                    a: 1,
                    b: 2,
                    c: 3
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
            expected.should.not.deep.equal(base);
        });
        it('should return merged config with nested objects', () => {
            const cfg = {
                    a: 1,
                    b: 2,
                    c: {
                        x: 1,
                        y: 2
                    }
                },
                base = {
                    c: {
                        z: 3
                    }
                },
                expected = {
                    a: 1,
                    b: 2,
                    c: {
                        x: 1,
                        y: 2,
                        z: 3
                    }
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
            expected.should.not.deep.equal(base);
        });
        it('should return merged config with nested objects (object key missing from base)', () => {
            const cfg = {
                    c: {
                        x: 1
                    }
                },
                base = {
                    a: 1
                },
                expected = {
                    a: 1,
                    c: {
                        x: 1
                    }
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
            expected.should.not.deep.equal(base);
        });
        it('should return merged config with nested objects (object key missing from config)', () => {
            const cfg = {
                    a: 1
                },
                base = {
                    c: {
                        z: 3
                    }
                },
                expected = {
                    a: 1,
                    c: {
                        z: 3
                    }
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
            expected.should.not.deep.equal(base);
        });
        it('should not merge arrays (array key in both)', () => {
            const cfg = {
                    a: [1]
                },
                base = {
                    a: [2]
                },
                expected = {
                    a: [1]
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
        });
        it('should not merge arrays (array key missing from config)', () => {
            const cfg = {},
                base = {
                    a: [2]
                },
                expected = {
                    a: [2]
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
        });
        it('should not merge arrays (array key missing from base)', () => {
            const cfg = {
                    a: [1]
                },
                base = {},
                expected = {
                    a: [1]
                };
            const result = SockBot.mergeConfig(base, cfg);
            expected.should.deep.equal(result);
        });
    });
    describe('loadPlugins()', () => {
        util.warn = () => 0;
        it('should return empty plugin list on missign plugin declaration', () => {
            [].should.deep.equal(SockBot.loadPlugins({}));
        });
        it('should not throw error when loadPlugin throws error', () => {
            util.loadModule = () => {
                throw new Error('i am an evil exception!');
            };
            expect(() => SockBot.loadPlugins({
                plugins: {
                    badplugin: {}
                }
            })).to.not.throw();
        });
        it('should update plugin config with merged config.', () => {
            util.loadModule = () => {
                return {
                    begin: () => 0
                };
            };
            const plugins = SockBot.loadPlugins({
                plugins: {
                    goodplugin: {
                        a: 1
                    }
                }
            });
            plugins.should.have.length(1);
            plugins[0].should.have.keys(['config', 'begin']);
            plugins[0].config.should.deep.equal({
                a: 1
            });
            util.loadModule = () => {
                throw new Error('i am an evil exception!');
            };
        });
    });
});
