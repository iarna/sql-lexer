'use strict';
var util = require('util');
var stream = require('stream');
var Delimiter = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.delimiter = [{type:'$symbol', value:';'}];
    this.delimiterValue = ';';
    this.buffer = [];
    this.nextBuffer = [];
    this.atNewCommand = true;
    this.setNewDelimiter = false;
}
util.inherits(Delimiter,stream.Transform);

Delimiter.prototype.isBufferDelimiter = function () {
    if (this.buffer.length!==this.delimiter.length) return false;
    for (var ii=0; ii<this.delimiter.length-1; ++ii) {
        if (this.delimiter[ii].type!==this.buffer[ii].type
        ||  this.delimiter[ii].value!==this.buffer[ii].value) return false;
    }
    var last = this.delimiter.length-1;
    if (this.delimiter[last].type!==this.buffer[last].type) return false;
    if (this.delimiter[last].value===this.buffer[last].value) return true;
    if (this.delimiter[last].value!==this.buffer[last].value.substr(0,this.delimiter[last].value.length)) return false;
    // If the the first part of the last token matches we have to split it in two as the first portion is the delimiter
    // and the second portion is the start of the next command.
    this.nextBuffer.push({type: this.buffer[last].type, value: this.buffer[last].value.substr(this.delimiter[last].value.length)});
    this.buffer[last].value =  this.buffer[last].value.substr(0,this.delimiter[last].value.length);
    return true;
}

Delimiter.prototype.flushBuffer = function () {
    if (this.isBufferDelimiter()) {
        var delim = {
            type: '$delimiter',
            value: this.delimiterValue,
            pos: this.buffer[0].pos,
            row: this.buffer[0].row,
            col: this.buffer[0].col
        };
        this.push(delim);
    }
    else {
        for (var ii in this.buffer) this.push(this.buffer[ii]);
    }
    this.buffer = this.nextBuffer;
    this.nextBuffer = [];
}

Delimiter.prototype.isWhitespace = function(token) {
    return (token.type==='$space' || token.type==='$comment' || token.type==='$commentCstyle');
}

Delimiter.prototype.setDelimiterFromBuffer = function() {
    this.delimiter = this.buffer;
    this.delimiterValue = '';
    for (var ii in this.delimiter) this.delimiterValue += this.delimiter[ii].value;
    this.push({type:'$setdelimiter',value:this.delimiterValue, pos:this.setNewDelimiter.pos, row:this.setNewDelimiter.row, col:this.setNewDelimiter.col});
    this.setNewDelimiter = false;
}

// TODO: MySQL actually defines the DELIMITER command as (pcre):
// /^\s* DELIMITER \s+ (?<new-delimiter>\S+) [^\n]* \n$/x
// We don't fully support those symantics because they're crazy. =p
// We define a delimiter as (tokenstream):
// $whitespace := $space | $comment | $eof
// $setdelimiter := $whitespace* $bareword{DELIMITER} (?<new-delimiter> (!$whitespace)+ ) $whitespace
Delimiter.prototype._transform = function(token,encoding,done) {
    if (this.atNewCommand) {
        if (this.isWhitespace(token)) {
            this.push(token);
            return done();
        }
        else {
            this.atNewCommand = false;
            if (token.type==='$bareword' && token.value.toUpperCase()==='DELIMITER') {
                this.setNewDelimiter = token;
                return done();
            }
        }
    }
    if (this.setNewDelimiter) {
        // We don't report the spaces been the DELIMITER command and the new delimiter
        if (this.buffer.length===0 && this.isWhitespace(token)) {
            return done();
        }
        // Whitespace defines the end of a delimiter
        if (this.isWhitespace(token)) {
            this.setDelimiterFromBuffer();
            this.buffer = [token];
        }
        else {
            this.buffer.push(token);
        }
    }
    else {
        if (this.isBufferDelimiter()) {
            this.flushBuffer();
            this.atNewCommand = true;
        }
        if (this.isWhitespace(token)) {
            this.flushBuffer();
            this.push(token);
        }
        else {
            this.buffer.push(token);
        }
        if (this.buffer.length > this.delimiter.length) {
            this.push(this.buffer.shift());
        }
    }
    done();
}
Delimiter.prototype._flush = function(done) {
    if (! this.setNewDelimiter) { this.flushBuffer(); done(); return }
    if (this.buffer.length) { this.setDelimiterFromBuffer(); done(); return }
    var error = this.setNewDelimiter;
    error.type = '$error';
    this.push(error);
    done();
}

module.exports = function (dialect) {
    return Delimiter;
}
