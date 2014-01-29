"use strict";
var lexer = require('./lexer.js');
var util = require('util');
var unicode = {
    L: require('unicode-6.3.0/categories/L/regex.js')
};

var SQL92 = module.exports.Scanner = function (options) {
    if (!options) options = {};
    if (!options.tokenMatcher) options.tokenMatcher = new TokenMatcher(this);
    lexer.Scanner.call(this, options);
}
util.inherits(SQL92,lexer.Scanner);

var TokenMatcher = module.exports.TokenMatcher = function(scanner) {
    lexer.TokenMatcher.call(this,scanner);
    this.matchers = [
        '$space',
        '$string',
        '$bstring',
        '$xstring',
        '$nstring',
        '$identifier',
        '$identifierQuoted',
        '$comment',
        '$approximateUnsignedNumber',
        '$approximateSignedNumber',
        '$exactUnsignedNumber',
        '$exactSignedNumber',
        '$symbol'
    ];
};
util.inherits(TokenMatcher,lexer.TokenMatcher);

TokenMatcher.prototype.$space = function (char) {
    if (char == " " || char == "\t" || char == "\n" || char == "\r") return this.consume(char);
    this.reject();
}
TokenMatcher.prototype.$space.EOB = function () { this.complete() };
TokenMatcher.prototype.$space.EOF = function () { this.complete() };

var stringMatcher$ = function (delim) {
    return function (char) {
        if (char != delim) return this.revert();
        var quoteEscape = function (char) {
            if (char == delim) {
                this.consume(char);
                this.active = stringChar;
            }
            else {
                this.complete();
            }
        }
        quoteEscape.EOF = function () { this.complete() };
        var stringChar = function (char) {
            if (char == delim) {
                this.consume();
                this.active = quoteEscape;
            }
            else {
                this.consume(char);
            }
        }
        this.active = stringChar;
        this.consume();
    }
}
TokenMatcher.prototype.$string = stringMatcher$("'");

var typedStringMatcher$ = function (prefix) {
    return function (char) {
        if ( char.toLowerCase() != prefix ) return this.reject();
        this.consume();
        this.active = this.$string;
    }
}

TokenMatcher.prototype.$bstring = typedStringMatcher$('b');
TokenMatcher.prototype.$nstring = typedStringMatcher$('n');
TokenMatcher.prototype.$xstring = typedStringMatcher$('x');

TokenMatcher.prototype.$identifier = function (char) {
    if (! char.match(unicode.L)) return this.reject();
    this.consume(char);
    this.active = function (char) {
        (char.match(unicode.L) || char.match(/[_0-9]/)) ? this.consume(char) : this.reject();
    }
    this.active.EOF = function () { this.complete() }
}

TokenMatcher.prototype.$identifierQuoted = stringMatcher$('"');

TokenMatcher.prototype.$comment = function (char) {
    if (char != '-') return this.reject();
    this.consume();
    this.active = function (char) {
        if (char != '-') return this.revert();
        this.consume();
        this.active = function (char) {
            this.consume(char);
            if (char == '\n') {
                this.complete();
            }
        }
        this.active.EOF = function () { this.complete() }
    }
}

var unsignedInteger$ = function (next) {
    return function (char) { char.match(/\d/) ? this.consume(char) : next ? next.call(this,char) : this.reject() };
}

var integerOnly$ = function (next) {
    var integer = unsignedInteger$(next);
    return function (char) {
        if (! char.match(/\d/)) { return this.revert() }
        this.consume(char);
        this.active = integer;
    }
}

var exactUnsignedNumericLiteral$ = function (next) {
    var unsignedInteger = unsignedInteger$(next);
    var integerOnly = integerOnly$(next);
    var integerDotInteger = unsignedInteger$(function (char){
        if (char!='.') { return next ? next.call(this,char) : this.reject() }
        this.consume(char);
        this.active = unsignedInteger;
    });
    return function (char) {
        if (char.match(/\d/)) {
            this.consume(char);
            this.active = integerDotInteger;
        }
        else if (char == '.') {
            this.consume(char);
            this.active = integerOnly;
        }
        else {
            next ? next.call(this,char) : this.revert();
        }
    }
}

var approximateUnsignedNumericLiteral$ = function (next) {
    var integerOnly = integerOnly$(next);
    var exponent = function (char) {
        if (char.match(/[-+]/)) {
            this.consume(char);
            this.active = integerOnly;
        }
        else {
           this.active = integerOnly;
           this.active(char);
        }
    }
    return exactUnsignedNumericLiteral$(function (char) {
        if (char.toLowerCase()!='e') { return this.revert() }
        this.consume(char);
        this.active = exponent;
    })
}

TokenMatcher.prototype.$approximateUnsignedNumber = approximateUnsignedNumericLiteral$();
TokenMatcher.prototype.$approximateSignedNumber = function (char) {
    if (! char.match(/[-+]/)) { return this.revert() }
    this.consume(char);
    this.active = this.$approximateUnsignedNumber;
}

TokenMatcher.prototype.$exactUnsignedNumber = exactUnsignedNumericLiteral$();
TokenMatcher.prototype.$exactSignedNumber = function (char) {
    if (! char.match(/[-+]/)) { return this.revert() }
    this.consume(char);
    this.active = this.$exactUnsignedNumber;
}

TokenMatcher.prototype.$symbol = function (char) {
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
            char == '=' ? this.consume(char).complete() : this.reject();
        }
        break;
    case '|':
        this.consume(char);
        this.active = function (char) {
            char == '|' ? this.consume(char).complete() : this.reject();
        }
        break;
    default:
        this.reject();
    }
}
