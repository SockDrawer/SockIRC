'use strict';

var client = require('./client');
var logger = require('./modules/log2console');
var config = {
    server: 'irc.darkmyst.org',
    nick: 'sockbot',
    channels: ['#crossings_ooc']
};


var events = client.connect(config);
logger.begin(events);
