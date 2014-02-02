"use strict";
var LexerDebugger = require('./lexer-debug.js');
var Pipes = require('./pipe-combiner.js');
var util = require('util');
var SQL92 = module.exports = {
    Colorize: require('./colorize-sql92.js'),
    Lex: require('./lexer-sql92.js'),
    Keyword: require('./sql92-keywords.js'),
    TraceLex: function (L0,L1) {
        if (!L0) L0 = SQL92.Lex.TokenMatcherL0;
        if (!L1) L1 = SQL92.Lex.TokenMatcherL1;
        L0 = LexerDebugger(L0);
        L1 = LexerDebugger(L1);
        Pipes.call(this,[new L0(),new L1()]);
    }
};
util.inherits(module.exports.TraceLex, Pipes);