"use strict";
var util = require('util');
var stream = require('stream');

var TokenMatcherL0 = function(options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this,options);

    this.on('pipe',function (stream) { stream.setEncoding('utf8'); });
    this.active = null;
    this.type = null;
    this.buffer = '';
    this.matchers = [];
    this.streamPos = 0;
    this.streamRow = 0;
    this.streamCol = 0;
}
util.inherits(TokenMatcherL0,stream.Transform);

TokenMatcherL0.prototype._transform = function(data,encoding,done) {
    if (data instanceof Buffer) { return done(new Error('SQL lexer input stream must be in UTF8 mode')) }
    for (var ii=0; ii<data.length; ++ii) {
        this.match( data[ii] );
    }
    done();
}

TokenMatcherL0.prototype.match = function (char) {
    this.hungry = true;
    while (this.hungry) {
        this.active ? this.active(char) : this.detect(char);
    }
    ++ this.streamPos;
    if (char==='\n') {
        ++ this.streamRow;
        this.streamCol = 0;
    }
    else {
        ++ this.streamCol;
    }
}

TokenMatcherL0.prototype.detect = function (char) {
    for (var ii in this.matchers) {
        this.type = this.matchers[ii];
        this[this.type].call(this,char);
        if (! this.hungry) return;
    }
    char==='eof' ? this.consume() : this.consume(char).error();
}

TokenMatcherL0.prototype._flush = function(done) {
    if (this.active) this.active('eof');
    this.push({type: '$eof', value: '', pos:this.streamPos, row:this.streamRow, col:this.streamCol});
    done();
}

TokenMatcherL0.prototype.consume = function(char,active) {
    if (char==='eof') throw new Error('Error in parser: Unexpected EOF while in '+this.type);
    if (char===null || typeof char==='undefined') char = '';
    if (! this.active) {
        this.active = active? active: this[this.type];
        this.pos = this.streamPos;
        this.row = this.streamRow;
        this.col = this.streamCol;
    }
    // nom nom nom
    this.hungry = false;
    this.buffer += char;
    return this;
}

TokenMatcherL0.prototype.reject = TokenMatcherL0.prototype.complete = function(type,value) {
    if (!this.active) return this;
    if (this.buffer.length || (value && value.length)) {
        this.push({
            type: type ? type : this.type,
            value: value ? value : this.buffer,
            pos: this.pos,
            row: this.row,
            col: this.col
        });
    }
    this.active = null;
    this.type = null;
    this.buffer = '';
    return this;
}

TokenMatcherL0.prototype.error = function(value) {
    this.hungry = false;
    return this.complete('$error',value);
}

module.exports = function (dialect) {
    return TokenMatcherL0;
}

