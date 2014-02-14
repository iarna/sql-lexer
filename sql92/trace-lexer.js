'use strict';
var lexerDebugger = require('../base/lexer-debug.js');

module.exports = function (dialect) {
    var debugdialect = Object.create(dialect);
    debugdialect.TokenMatcherL0 = lexerDebugger(dialect.TokenMatcherL0);
    debugdialect.TokenMatcherL1 = lexerDebugger(dialect.TokenMatcherL1);
    return require('./lexer.js')( debugdialect );
}
