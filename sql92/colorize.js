'use strict';
var Colorize = require('../base/colorize.js'),
    util = require('util');

module.exports = function (dialect) {
    var ColorizeSQL92 = function (options) {
        Colorize.call(this, options);
    }
    util.inherits(ColorizeSQL92,Colorize);

    ColorizeSQL92.prototype._transform = function (token,encoding,done) {
        if (token.type==='$space') {
            this.push(this.colors.space(dialect.toSQL(token)));
        }
        else if (token.type==='$comment') {
            this.push(this.colors.comment(dialect.toSQL(token)));
        }
        else if (token.type.match(/^[$][bxn]?string$/)) {
            this.push(this.colors.string(dialect.toSQL(token)));
        }
        else if (token.type==='$identifierQuoted') {
            this.push(this.colors.identifier(dialect.toSQL(token)));
        }
        else if (token.type==='$symbol') {
            this.push( this.colors.symbol(dialect.toSQL(token)) );
        }
        else if (token.type==='$approximateUnsignedNumber' || token.type==='$approximateSignedNumber' ||
            token.type==='$exactUnsignedNumber' || token.type==='$exactSignedNumber') {
            this.push( this.colors.number(dialect.toSQL(token)) );
        }
        else if (token.type==='$bareword') {
            var kw = token.value.toUpperCase();
            if (dialect.keyword.isReserved(kw)) {
                this.push( this.colors.keyword(dialect.toSQL(token)) );
            }
            else {
                this.push( this.colors.identifier(dialect.toSQL(token)) );
            }
        }
        else if (token.type==='$error') {
            this.push( this.colors.error(dialect.toSQL(token)) );
        }
        else {
            this.push( this.colors.error(JSON.stringify(token)) );
        }
        done();
    }

    return ColorizeSQL92;
}
