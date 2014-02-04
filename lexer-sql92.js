"use strict";
var lexer = require('./lexer.js');
var Pipes = require('./pipe-combiner.js');
var util = require('util');
var stream = require('stream');
var unicode = {
    L: require('unicode-6.3.0/categories/L/regex.js')
};

var SQL92 = module.exports = function() {
    Pipes.call(this, [new TokenMatcherL0(),new TokenMatcherL1(), new lexer.CoalesceTokens()]);
}
util.inherits(SQL92, Pipes);

var TokenMatcherL0 = SQL92.TokenMatcherL0 = function(options) {
    lexer.TokenMatcherL0.call(this,options);
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

var TokenMatcherL1 = SQL92.TokenMatcherL1 = function(options) {
    lexer.TokenMatcherL1.call(this,options);
    this.matchers = [
        '$error',
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

var passthrough$ = function (type) {
    return function (token) {
        token.type === this.type ? this.consume(token).complete() : this.reject();
    }
}

TokenMatcherL1.prototype.$error = passthrough$();
TokenMatcherL1.prototype.$space = passthrough$();
TokenMatcherL1.prototype.$comment = passthrough$();
TokenMatcherL1.prototype.$string = passthrough$();

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

TokenMatcherL1.prototype.$identifierQuoted = passthrough$();

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

var passthroughType$ = function (type) {
    return function (token) {
        token.type === type ? this.consume(token).complete() : this.reject();
    }
}

TokenMatcherL1.prototype.$bareword = passthroughType$('$letters');
TokenMatcherL1.prototype.$symbol = passthroughType$('$symbol');

var CombineStrings = SQL92.CombineStrings = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.string = null;
    this.buffer = [];
}
util.inherits(CombineStrings,stream.Transform);

CombineStrings.prototype._transform = function(data,encoding,done) {
    if (this.string) {
        if (data.type == '$string') {
            this.buffer = [];
            this.string.value += data.value;
        }
        else if (data.type == '$space') {
            this.buffer.push(data);
        }
        else {
            this.push(this.string);
            for (var ii in this.buffer) {
                this.push(this.buffer[ii]);
            }
            this.string = null;
            this.buffer = [];
        }
    }
    else {
        if (data.type == '$string') {
            this.string = data;
        }
        else {
            this.push(data);
        }
    }
    done();
}
CombineStrings.prototype._flush = function() {
    if (! this.string) return;
    this.push(this.string);
    for (var ii in this.buffer) {
        this.push(this.buffer[ii]);
    }
}
