"use strict";
var lexer = require('./lexer.js');
var util = require('util');
var unicode = {
    L: require('unicode-6.3.0/categories/L/regex.js')
};

var SQL92 = module.exports.Scanner = function (options) {
    if (!options) options = {};
    if (!options.tokenMatcherL0) options.tokenMatcherL0 = new TokenMatcherL0(this);
    if (!options.tokenMatcherL1) options.tokenMatcherL1 = new TokenMatcherL1(this);
    lexer.Scanner.call(this, options);
}
util.inherits(SQL92,lexer.Scanner);

var TokenMatcherL0 = module.exports.TokenMatcherL0 = function() {
    lexer.TokenMatcherL0.call(this);
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
util.inherits(TokenMatcherL0,lexer.TokenMatcherL0);
TokenMatcherL0.prototype.$space = function (char) {
    if (char == " " || char == "\t" || char == "\n" || char == "\r") return this.consume(char);
    this.reject();
}
TokenMatcherL0.prototype.$space.EOB = function () { this.complete() };
TokenMatcherL0.prototype.$space.EOF = function () { this.complete() };

TokenMatcherL0.prototype.$comment = function (char) {
    if (char != '-') return this.reject();
    this.consume();
    this.active = function (char) {
        if (char != '-') {
            return this.complete('$symbol','-');
        }
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

TokenMatcherL0.prototype.$digits = function (char) {
    if (char.match(/\d/)) return this.consume(char);
    this.reject();
}
TokenMatcherL0.prototype.$digits.EOF = function () { this.complete() };

TokenMatcherL0.prototype.$letters = function (char) {
    if (char.match(unicode.L)) return this.consume(char);
    this.reject();
}
TokenMatcherL0.prototype.$letters.EOF = function () { this.complete() };

var stringMatcher$ = function (delim) {
    return function (char) {
        if (char != delim) return this.reject();
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

TokenMatcherL0.prototype.$string = stringMatcher$("'");

TokenMatcherL0.prototype.$identifierQuoted = stringMatcher$('"');

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

var TokenMatcherL1 = module.exports.TokenMatcherL1 = function() {
    lexer.TokenMatcherL1.call(this);
    this.matchers = [
        '$space',
        '$comment',
        '$bstring',
        '$xstring',
        '$nstring',
        '$string',
        '$identifierQuoted',
        '$approximateUnsignedNumber',
        '$approximateSignedNumber',
        '$exactUnsignedNumber',
        '$exactSignedNumber',
        '$bareword',
        '$symbol'
    ];
}
util.inherits(TokenMatcherL1,lexer.TokenMatcherL1);

var passthru$ = function (type) {
    var matcher;
    if (type) {
        matcher = function (token) {
            token.type === type ? this.consume(token).complete() : this.reject();
        }
    }
    else {
        matcher = function (token) {
            token.type === this.type ? this.consume(token).complete() : this.reject();
        }
    }
    return matcher;
}

TokenMatcherL1.prototype.$space = passthru$();
TokenMatcherL1.prototype.$comment = passthru$();
TokenMatcherL1.prototype.$string = passthru$();

var typedStringMatcher$ = function (prefix) {
   return function (token) {
       if ( token.type != '$letters' || token.value.toLowerCase() != prefix ) return this.reject();
       this.consume(token);
       this.active = function (token) {
           if (token.type != '$string') return this.revert();
           this.consume(token).complete();
       };
       this.active.value = function () { return this.buffer[1].value }
   }
}

TokenMatcherL1.prototype.$bstring = typedStringMatcher$('b');
TokenMatcherL1.prototype.$nstring = typedStringMatcher$('n');
TokenMatcherL1.prototype.$xstring = typedStringMatcher$('x');

TokenMatcherL1.prototype.$identifierQuoted = passthru$();

var unsignedInteger$ = function (next) {
    return function (token) { token.type == '$digits' ? this.consume(token) : next ? next.call(this,token) : this.reject() };
}

var integerOnly$ = function (next) {
    var integer = unsignedInteger$(next);
    return function (token) {
        if (token.type != '$digits') { return this.revert() }
        this.consume(token);
        this.active = integer;
    }
}

var exactUnsignedNumericLiteral$ = function (next) {
    var unsignedInteger = unsignedInteger$(next);
    var integerOnly = integerOnly$(next);
    var integerDotInteger = unsignedInteger$(function (token){
        if (token.type!='$symbol' || token.value!='.') { return next ? next.call(this,token) : this.reject() }
        this.consume(token);
        this.active = unsignedInteger;
    });
    return function (token) {
        if (token.type == '$digits') {
            this.consume(token);
            this.active = integerDotInteger;
        }
        else if (token.type == '$symbol' && token.value=='.') {
            this.consume(token);
            this.active = integerOnly;
        }
        else {
            next ? next.call(this,token) : this.revert();
        }
    }
}

var approximateUnsignedNumericLiteral$ = function (next) {
    var integerOnly = integerOnly$(next);
    var exponent = function (token) {
        if (token.type == '$symbol' && token.value.match(/^[-+]$/)) {
            this.consume(token);
            this.active = integerOnly;
        }
        else {
           this.active = integerOnly;
           this.active(token);
        }
    }
    return exactUnsignedNumericLiteral$(function (token) {
        if (token.type != '$letters' || token.value.toLowerCase()!='e') { return this.revert() }
        this.consume(token);
        this.active = exponent;
    })
}

TokenMatcherL1.prototype.$approximateUnsignedNumber = approximateUnsignedNumericLiteral$();
TokenMatcherL1.prototype.$approximateSignedNumber = function (token) {
    if (token.type!='$symbol' || (token.value!='-' && token.value!= '+')) { return this.revert() }
    this.consume(token);
    this.active = this.$approximateUnsignedNumber;
}

TokenMatcherL1.prototype.$exactUnsignedNumber = exactUnsignedNumericLiteral$();
TokenMatcherL1.prototype.$exactSignedNumber = function (token) {
    if (token.type!='$symbol' || (token.value!='-' && token.value!= '+')) { return this.revert() }
    this.consume(token);
    this.active = this.$exactUnsignedNumber;
}

TokenMatcherL1.prototype.$bareword = passthru$('$letters');
TokenMatcherL1.prototype.$symbol = passthru$('$symbol');
