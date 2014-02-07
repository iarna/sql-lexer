'use strict';
var ColorizeSQL92 = require('./colorize-sql92.js'),
    keyword = require('./mysql-keywords.js'),
    util = require('util'),
    clc = require('cli-color');

var ColorizeMYSQL = module.exports = function (options) {
    ColorizeSQL92.call(this, options);
    this.colors.delimiter = clc.xterm(253);
}
util.inherits(ColorizeMYSQL,ColorizeSQL92);

ColorizeMYSQL.prototype._transform = function (data,encoding,done) {
    if (data.type === '$hexLiteral') {
        this.push(this.colors.string('0x'+data.value));
    }
    else if (data.type === '$bitLiteral') {
        this.push(this.colors.string('0b'+data.value));
    }
    else if (data.type === '$null') {
        this.push(this.colors.string(data.value));
    }
    else {
        return ColorizeSQL92.prototype._transform.call(this,data,encoding,done);
    }
    done();
}
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
    else if (data.type == '$userDefined') {
        this.push( this.colors.identifier(data.value) );
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
    else if (data.type == '$delimiter') {
        this.push( this.colors.delimiter(data.value) );
    }
    else if (data.type == '$setdelimiter') {
        this.push( this.colors.delimiter('DELIMITER '+data.value) );
    }
    else {
        this.push( this.colors.error(JSON.stringify(data.value)) );
    }
    done();
}



