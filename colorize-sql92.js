"use strict";
var Colorize = require('./colorize.js'),
    keyword = require('./sql92-keywords.js'),
    util = require('util');

var ColorizeSQL92 = module.exports = function (options) {
    Colorize.call(this, options);
}
util.inherits(ColorizeSQL92,Colorize);


ColorizeSQL92.prototype._transform = function (data,encoding,done) {
    if (data.type == '$space') {
        this.push(this.colors.space(data.value));
    }
    else if (data.type == '$comment') {
        this.push(this.colors.comment('--'+data.value));
    }
    else if (data.type.match(/^[$][bxn]?string$/)) {
        var value = "'" + data.value.replace("'","''") + "'";
        if (data.type == '$bstring') {
            value = 'B' + value;
        }
        else if (data.type == '$xstring') {
            value = 'X' + value;
        }
        else if (data.value == '$nstring') {
            value = 'N' + value;
        }
        this.push(this.colors.string(value));
    }
    else if (data.type == '$identifierQuoted') {
        this.push( this.colors.identifier('"' + data.value.replace('"','""') + '"') );
    }
    else if (data.type == '$symbol') {
        this.push( this.colors.symbol(data.value) );
    }
    else if (data.type == '$approximateUnsignedNumber' || data.type == '$approximateSignedNumber' ||
        data.type == '$exactUnsignedNumber' || data.type == '$exactSignedNumber') {
        this.push( this.colors.number(data.value) );
    }
    else if (data.type == '$bareword') {
        var kw = data.value.toUpperCase();
        if (keyword.isReserved(kw)) {
            this.push( this.colors.keyword(data.value) );
        }
        else {
            this.push( this.colors.identifier(data.value) );
        }
    }
    else if (data.type == '$error') {
        this.push( this.colors.error(data.value) );
    }
    else {
        this.push( this.colors.error(JSON.stringify(data.value)) );
    }
    done();
}



