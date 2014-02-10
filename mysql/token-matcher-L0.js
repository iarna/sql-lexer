'use strict';
var util = require('util');

module.exports = function (dialect) {
    var SQL92TokenMatcherL0 = require('../sql92/token-matcher-L0.js')(dialect);

    var TokenMatcherL0 = function(options) {
        SQL92TokenMatcherL0.call(this,options);
        this.matchers = [
            '$space',
            '$comment',
            '$commentCstyle',
            '$string',
            '$identifierQuoted',
            '$letters',
            '$binLiteral',
            '$null',
            '$digits',
            '$symbol'
        ];
    }
    util.inherits(TokenMatcherL0,SQL92TokenMatcherL0);

    TokenMatcherL0.prototype.$symbol = function (char) {
        switch (char) {
        case '@':
        case '%':
        case '^':
            this.consume(char).complete();
            break;
        case '&':
            this.consume(char);
            this.active = function (char) {
                char==='&' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
            }
            break;	
        case '!':
            this.consume(char);
            this.active = function (char) {
                char==='=' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
            }
            break;
        case '<':
            this.consume(char);
            this.active = function (char) {
                switch (char) {
                case 'eof':
                    this.consume().complete();
                    break;
                case '<':
                case '>':
                    this.consume(char).complete();
                    break;
                case '=':
                    this.consume(char);
                    this.active = function (char) {
                        char==='>' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
                    }
                    break;
                default:
                    this.reject();
                }
            }
            break;
        case '>':
            this.consume(char);
            this.active = function (char) {
                (char==='=' || char==='>') ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
            }
            break;
        default:
            SQL92TokenMatcherL0.prototype.$symbol.call(this,char);
        }
    }

    var stringMatcher$ = TokenMatcherL0.stringMatcher$ = function (delim,what) {
        return function (char) {
            if (char !== delim) return this.reject();
            var quoteEscape = function (char) {
                if (char !== delim) return this.complete();

                this.consume(char);
                this.active = stringChar;
            }
            var escapedChars = {
                '0': String.fromCharCode(0),
                "'": "'",
                '"': '"',
                '\\': '\\',
                'b': String.fromCharCode(8),
                'n': String.fromCharCode(10),
                'r': String.fromCharCode(13),
                't': String.fromCharCode(9),
                'Z': String.fromCharCode(26),
                '%': '\\%',
                '_': '\\_'
            }
            var slashEscape = function (char) {
                if (char==='eof') return this.error('unterminated '+what);
                this.consume( char in escapedChars ? escapedChars[char] : char );
                this.active = stringChar;
            }
            var stringChar = function (char) {
                if (char==='eof') return this.error('unterminated '+what);
                if (char!==delim) return this.consume(char);
                if (char === delim) {
                    this.consume();
                    this.active = quoteEscape;
                }
                else if (char === '\\') {
                    this.consume();
                    this.active = slashEscape;
                }
                else {
                    this.consume(char);
                }
            }
            this.consume();
            this.active = stringChar;
        }
    }


    var $singleQuotedString = TokenMatcherL0.stringMatcher$("'", 'string');

    var $doubleQuotedString = TokenMatcherL0.stringMatcher$('"', 'string');

    TokenMatcherL0.prototype.$string = function (char) {
        if (char==="'") {
            return $singleQuotedString.call(this,char);
        }
        if (char==='"') {
            return $doubleQuotedString.call(this,char);
        }
        this.reject();
    }

    TokenMatcherL0.prototype.$identifierQuoted = SQL92TokenMatcherL0.stringMatcher$('`', 'delimited identifier');

    TokenMatcherL0.prototype.$commentCstyle = function (char) {
        if (char!=='/') return this.reject();
        this.consume();
        this.active = function (char) {
            if (char!=='*') return this.reject();
            this.consume();
            var maybeSlash = function (char) {
                if (char==='eof') return this.error('unterminated c-style comment');
                if (char==='/') return this.consume().complete();
                this.consume('*'+char);
                this.active = inComment;
            }
            var inComment = function (char) {
                if (char==='eof') return this.error('unterminated c-style comment');
                if (char!=='*') return this.consume(char);
                this.consume();
                this.active = maybeSlash;
            }
            this.active = inComment;
        }
    }

    TokenMatcherL0.prototype.$null = function (char) {
        if (char!=='\\') return this.reject();
        this.consume(char);
        this.active = function (char) {
            if (char==='N') return this.consume(char).complete();
            this.error();
            this.match(char);
        }
    }

    TokenMatcherL0.prototype.$binLiteral = function (char) {
        if (char !== '0') return this.reject();
        this.consume();
        this.active = function (char) {
            if (char === 'x') {
                this.type = '$hexLiteral';
                this.consume();
                this.active = function (char) {
                    if (char.match(/^[A-Fa-f0-9]$/)) {
                        this.consume(char);
                        this.active = function (char) {
                            char.match(/^[A-Fa-f0-9]$/) ? this.consume(char) : this.reject();
                        }
                        return;
                    }
                    this.complete('$digits','0');
                    this.complete('$letters','x');
                    this.reject();
                }
            }
            else if (char === 'b') {
                this.type = '$bitLiteral';
                this.consume();
                this.active = function (char) {
                    if (char.match(/^[01]$/)) {
                        this.consume(char);
                        this.active = function (char) {
                            char.match(/^[01]$/) ? this.consume(char) : this.reject();
                        }
                        return;
                    }
                    this.complete('$digits','0');
                    this.complete('$letters','b');
                    this.reject();
                }
            }
            else {
                this.complete('$digits','0');
                this.reject();
                return;
            }
        }
    }

    return TokenMatcherL0;
}
