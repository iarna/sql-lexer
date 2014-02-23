'use strict';
var util = require('util');

module.exports = function (dialect) {
    var SQL92TokenMatcherL0 = require('../sql92/token-matcher-L0.js')(dialect);

    var TokenMatcherL0 = function(options) {
        SQL92TokenMatcherL0.call(this,options);
        this.matchers = [
            '$space',
            '$comment',
            '$string',
            '$identifierQuoted',
            '$identifierQuotedMySQL',
            '$identifierQuotedMSSQL',
            '$letters',
            '$digits',
            '$symbol'
        ];
    }
    util.inherits(TokenMatcherL0,SQL92TokenMatcherL0);

    TokenMatcherL0.prototype.$identifierQuotedMySQL = SQL92TokenMatcherL0.stringMatcher$('`', 'delimited identifier');

    TokenMatcherL0.prototype.$identifierQuotedMSSQL = function (char) {
        if (char!=='[') return this.reject();
        this.consume();
        this.active = function (char) {
            if (char==='eof') return this.error('unterminated mssql quoted identifier', '[' + this.buffer);
            if (char!==']') return this.consume(char);
            this.consume();
            this.complete();
        }
    }

    return TokenMatcherL0;
}
