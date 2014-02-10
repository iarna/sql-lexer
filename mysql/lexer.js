'use strict';
var Pipes = require('../util/pipe-combiner.js');
var util = require('util');

module.exports = function (dialect) {
    var MySQL = function() {
        Pipes.call(this, [new dialect.TokenMatcherL0(), new dialect.TokenMatcherL1(), new dialect.CoalesceTokens(), new dialect.Delimiter()]);
    }
    util.inherits(MySQL, Pipes);
    return MySQL;
}
