'use strict';
var LexerDebugger = require('./lexer-debug.js');
var lexer = require('./lexer.js');
var Pipes = require('./pipe-combiner.js');
var util = require('util');
var MySQL = module.exports = {
    Colorize: require('./colorize-mysql.js'),
    Lex: require('./lexer-mysql.js'),
    Keyword: require('./mysql-keywords.js'),
    TraceLex: function (L0,L1) {
        if (!L0) L0 = MySQL.Lex.TokenMatcherL0;
        if (!L1) L1 = MySQL.Lex.TokenMatcherL1;
        L0 = LexerDebugger(L0);
        L1 = LexerDebugger(L1);
        Pipes.call(this,[new L0(),new L1(),new lexer.CoalesceTokens(), new MySQL.Lex.Delimiter()]);
    }
};
util.inherits(module.exports.TraceLex, Pipes);