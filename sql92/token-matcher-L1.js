'use strict';
var util = require('util');

module.exports = function (dialect) {
    var BaseTokenMatcherL1 = require('../base/token-matcher-L1.js')(dialect);

    var TokenMatcherL1 = function(options) {
        BaseTokenMatcherL1.call(this,options);
        this.matchers = [
            '$error',
            '$space',
            '$comment',
            '$charsetstring',
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
            '$symbol',
            '$eof'
        ];
    }
    util.inherits(TokenMatcherL1,BaseTokenMatcherL1);

    var $passthrough = TokenMatcherL1.$passthrough = function () {
        this.token.type===this.type ? this.consume().complete() : this.reject();
    }

    TokenMatcherL1.prototype.$error = $passthrough;
    TokenMatcherL1.prototype.$space = $passthrough;
    TokenMatcherL1.prototype.$comment = $passthrough;
    TokenMatcherL1.prototype.$string = $passthrough;

    TokenMatcherL1.prototype.$charsetstring = function () {
        if (this.token.type!=='$letters' || this.token.value[0]!=='_') return this.reject();
        this.consume();
        this.active = function () {
            if (this.token.type==='$digits') return this.consume();
            if (this.token.type==='$letters') return this.consume()
            if (this.token.type!=='$string') return this.revert();
            this.consume().complete('$string');
        };
        this.active.attr = function () {
            var charset = this.buffer[0].value.substr(1);
            for (var ii=1; ii<(this.buffer.length-1); ++ii) {
                charset += this.buffer[ii].value;
            }
            return {'charset': charset};
        }
        this.active.value = function () { return this.buffer[this.buffer.length-1].value }
    }

    var typedStringMatcher$ = function (prefix) {
        return function () {
            if ( this.token.type!=='$letters' || this.token.value.toLowerCase()!==prefix ) return this.reject();
            this.consume();
            this.active = function () {
                if (this.token.type!=='$string') return this.revert();
                this.consume().complete();
            };
            this.active.value = function () { return this.buffer[1].value }
        }
    }

    TokenMatcherL1.prototype.$bstring = typedStringMatcher$('b');
    TokenMatcherL1.prototype.$nstring = typedStringMatcher$('n');
    TokenMatcherL1.prototype.$xstring = typedStringMatcher$('x');

    TokenMatcherL1.prototype.$identifierQuoted = $passthrough;

    TokenMatcherL1.prototype.$eof = $passthrough;

    var unsignedInteger$ = function (next) {
        return function () { this.token.type==='$digits' ? this.consume() : next ? next.call(this) : this.reject() };
    }

    var integerOnly$ = function (next) {
        var integer = unsignedInteger$(next);
        return function () {
            if (this.token.type!=='$digits') { return this.revert() }
            this.consume();
            this.active = integer;
        }
    }

    var exactUnsignedNumericLiteral$ = function (next) {
        var unsignedInteger = unsignedInteger$(next);
        var integerOnly = integerOnly$(next);
        var integerDotInteger = unsignedInteger$(function (){
            if (this.token.type!=='$symbol' || this.token.value!=='.') { return next ? next.call(this) : this.reject() }
            this.consume();
            this.active = unsignedInteger;
        });
        return function () {
            if (this.token.type==='$digits') {
                this.consume();
                this.active = integerDotInteger;
            }
            else if (this.token.type==='$symbol' && this.token.value==='.') {
                this.consume();
                this.active = integerOnly;
            }
            else {
                this.reject();
            }
        }
    }

    var approximateUnsignedNumericLiteral$ = function (next) {
        var integerOnly = integerOnly$(next);
        var exponent = function () {
            if (this.token.type==='$symbol' && this.token.value.match(/^[-+]$/)) {
                this.consume();
                this.active = integerOnly;
            }
            else {
                this.active = integerOnly;
                this.active();
            }
        }
        return exactUnsignedNumericLiteral$(function () {
            if (this.token.type!=='$letters' || this.token.value.toLowerCase()!=='e') { return this.revert() }
            this.consume();
            this.active = exponent;
        })
    }

    TokenMatcherL1.prototype.$approximateUnsignedNumber = approximateUnsignedNumericLiteral$();
    TokenMatcherL1.prototype.$approximateSignedNumber = function () {
        if (this.token.type!=='$symbol' || (this.token.value!=='-' && this.token.value!=='+')) { return this.revert() }
        this.consume();
        this.active = function () {
            if ((this.token.type==='$symbol' && this.token.value==='.') || this.token.type==='$digits') {
                this.active = this.$approximateUnsignedNumber;
                return this.active();
            }
            else {
                this.revert();
            }
        }
    }

    TokenMatcherL1.prototype.$exactUnsignedNumber = exactUnsignedNumericLiteral$();
    TokenMatcherL1.prototype.$exactSignedNumber = function () {
        if (this.token.type!=='$symbol' || (this.token.value!=='-' && this.token.value!=='+')) { return this.revert() }
        this.consume();
        this.active = function () {
            if ((this.token.type==='$symbol' && this.token.value==='.') || this.token.type==='$digits') {
                this.active = this.$exactUnsignedNumber;
                return this.active();
            }
            else {
                this.revert();
            }
        }
    }

    TokenMatcherL1.prototype.$bareword = function () {
        if (this.token.type!=='$letters') return this.revert();
        this.consume();
        this.active = function () {
            switch (this.token.type) {
            case '$letters':
            case '$digits':
                this.consume();
                break;
            default:
                this.complete();
            }
        }
    }

    TokenMatcherL1.prototype.$symbol = $passthrough;

    return TokenMatcherL1;
}

