'use strict';
var util = require('util');
var unicode = {
    L: require('unicode-6.3.0/categories/L/regex.js')
};

module.exports = function (dialect) {
    var BaseTokenMatcherL0 = require('../base/token-matcher-L0.js')(dialect);

    var TokenMatcherL0 = function(options) {
        BaseTokenMatcherL0.call(this,options);
        this.matchers = [
            '$space',
            '$comment',
            '$string',
            '$identifierQuoted',
            '$letters',
            '$digits',
            '$symbol'
        ];
    }
    util.inherits(TokenMatcherL0,BaseTokenMatcherL0);

    TokenMatcherL0.prototype.$space = function (char) {
        if (char===' ' || char==='\t' || char==='\n' || char==='\r') return this.consume(char);
        if (char==='eof') return this.complete();
        this.reject();
    }

    TokenMatcherL0.prototype.$comment = function (char) {
        if (char!=='-') return this.reject();
        this.consume();
        this.active = function (char) {
            if (char!=='-') {
                return this.complete('$symbol',{},'-');
            }
            this.consume();
            this.active = function (char) {
                if (char==='eof') return this.complete();
                this.consume(char);
                if (char==='\n') {
                    this.complete();
                }
            }
        };
    }

    TokenMatcherL0.prototype.$digits = function (char) {
        if (char==='eof') return this.complete();
        if (char.match(/\d/)) return this.consume(char);
        this.reject();
    }

    TokenMatcherL0.prototype.$letters = function (char) {
        if (char==='eof') return this.complete();
        if (char.match(unicode.L) || char==='_') return this.consume(char);
        this.reject();
    }

    var stringMatcher$ = TokenMatcherL0.stringMatcher$ = function (delim,what) {
        return function (char) {
            if (char!==delim) return this.reject();
            var quoteEscape = function (char) {
                if (char!==delim) return this.complete();

                this.consume(char);
                this.active = stringChar;
            }
            var stringChar = function (char) {
                if (char==='eof') return this.error('unterminated '+what, delim + this.buffer);
                if (char!==delim) return this.consume(char);
                if (char===delim) {
                    this.consume();
                    this.active = quoteEscape;
                }
                else {
                    this.consume(char);
                }
            }
            this.consume()
            this.active = stringChar;
        }
    }

    TokenMatcherL0.prototype.$string = stringMatcher$("'", 'string');

    TokenMatcherL0.prototype.$identifierQuoted = stringMatcher$('"', 'delimited identifier');

    TokenMatcherL0.prototype.$symbol = function (char) {
        switch (char) {
        case '(':
        case ')':
        case '*':
        case '+':
        case ',':
        case '-':
        case '/':
        case ';':
        case '=':
        case '.':
            this.consume(char).complete();
            break;
        case '<':
            this.consume(char);
            this.active = function (char) {
                switch (char) {
                case 'eof':
                    this.consume().complete();
                    break;
                case '>':
                case '=':
                    this.consume(char).complete();
                    break;
                default:
                    this.reject();
                }
            }
            break;
        case '>':
            this.consume(char);
            this.active = function (char) {
                char==='=' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
            }
            break;
        case '|':
            this.consume(char);
            this.active = function (char) {
                char==='|' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
            }
            break;
        default:
            this.reject();
        }
    }

    return TokenMatcherL0;
}
