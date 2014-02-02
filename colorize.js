"use strict";
var clc = require('cli-color'),
    util = require('util'),
    stream = require('stream');

var Colorize = module.exports = function (options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this, options);
    var nocolor = function (str) { return str };
    this.colors = {
        space: nocolor,
        comment: clc.xterm(240),
        string: clc.xterm(37),
        identifier: clc.xterm(132),
        symbol: clc.xterm(241),
        number: clc.xterm(37),
        keyword: clc.xterm(61),
        error: clc.white.bold.bgRed
    };
}
util.inherits(Colorize,stream.Transform);
