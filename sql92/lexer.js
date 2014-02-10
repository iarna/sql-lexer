'use strict';
var Pipes = require('../util/pipe-combiner.js');
var util = require('util');

module.exports = function (dialect) {
    var SQL92 = function() {
        Pipes.call(this, [new dialect.TokenMatcherL0(), new dialect.TokenMatcherL1(), new dialect.CoalesceTokens()]);
    }
    util.inherits(SQL92, Pipes);
    return SQL92;
}
