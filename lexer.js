"use strict";
var util = require('util');
var stream = require('stream');

var Scanner = exports.Scanner = function (options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this, options);
    if ( ! (this.tokenMatcherL0 = options.tokenMatcherL0) ) {
        throw new Error('SQL Lexer requires an L0 tokenMatcher in order to function');
    }

    if ( ! (this.tokenMatcherL1 = options.tokenMatcherL1) ) {
        throw new Error('SQL Lexer requires an L1 tokenMatcher in order to function');
    }
    this.tokenMatcherL0.emitToken = function(token) { this.tokenMatcherL1.match(token) }.bind(this);
    this.tokenMatcherL1.emitToken = function(token) { this.push(token) }.bind(this);
}
util.inherits(Scanner,stream.Transform);

Scanner.prototype._transform = function(data,encoding,done) {
    for (var ii=0; ii<data.length; ++ii) {
        this.tokenMatcherL0.match( data.charAt(ii) );
    }
    this.tokenMatcherL0.eob();
    done();
}

Scanner.prototype._flush = function () {
    this.tokenMatcherL0.eof();
}

var TokenMatcherL0 = exports.TokenMatcherL0 = function() {
    this.active = null;
    this.type = null;
    this.buffer = '';
    this.matchers = [];
    this.streamPos = 0;
    this.streamRow = 0;
    this.streamCol = 0;
}

TokenMatcherL0.prototype.match = function (char) {
    this.hungry = true;
    while (this.hungry) {
       this.active ? this.active(char) : this.detect(char);
    }
    ++ this.streamPos;
    if (char == '\n') {
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
    this.consume(char).error();
}

TokenMatcherL0.prototype.eof = function() {
    if (this.active) {
        if (this.active.EOF) {
            this.active.EOF.call(this);
        }
        else {
            console.log(this.active);
            this.error('Premature EOF while in '+this.active);
        }
    }
}

TokenMatcherL0.prototype.eob = function() {
    if ((this.active) && this.active.EOB) this.active.EOB.call(this);
}

TokenMatcherL0.prototype.consume = function(char) {
    if (char==null) char = '';
    if (! this.active) {
        this.active = this[this.type];
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
    if (!this.active) return;
    if (this.buffer.length || value.length) {
        this.emitToken({
            type:  type ? type : this.type,
            value: value ? value : this.buffer,
            pos:   this.pos,
            row:   this.row,
            col:   this.col
            });
    }
    this.active = null;
    this.type = null;
    this.buffer = '';
    return this;
}

TokenMatcherL0.prototype.error = function(value) {
    return this.complete('$error',value);
}

var TokenMatcherL1 = exports.TokenMatcherL1 = function() {
    this.active = null;
    this.type = null;
    this.buffer = [];
    this.matchers = [];
    this.skip = {};
    this.matchBuffer = [];
}

TokenMatcherL1.prototype.match = function (token) {
    this.matchBuffer = [token];
    while (this.matchBuffer.length) {
       this.active ? this.active(this.matchBuffer[0]) : this.detect(this.matchBuffer[0]);
    }
}
TokenMatcherL1.prototype.consume = function(token) {
    if (! this.active) {
        this.active = this[this.type];
    }
    this.matchBuffer.shift();
    if (token) this.buffer.push(token);
    return this;
}

TokenMatcherL1.prototype.reject = TokenMatcherL1.prototype.complete = function(type,value) {
    if (!type) type = this.type;
    if (!type) return;
    if (!value) {
        if (this.active && this.active.value) {
            value = this.active.value.call(this);
        }
        else {
            value = '';
            this.buffer.forEach(function (token) { value += token.value });
        }
    }
    if (value.length) {
        this.emitToken({
            type:  type,
            value: value,
            pos:   this.buffer[0].pos,
            row:   this.buffer[0].row,
            col:   this.buffer[0].col
            });
        this.skip = {};
    }
    this.active = null;
    this.type = null;
    this.buffer = [];
    return this;
}

TokenMatcherL1.prototype.error = function(value) {
    return this.complete('$error',value);
}

TokenMatcherL1.prototype.detect = function (token) {
    var bufferSize = this.matchBuffer.length;
    for (var ii in this.matchers) {
        this.type = this.matchers[ii];
        if (this.skip[this.type]) continue;
        this[this.type].call(this,token);
        if (bufferSize != this.matchBuffer.length) return;
    }
    this.consume(token).error(this.buffer);
}

TokenMatcherL1.prototype.revert = function() {
    if (!this.active) return this.reject();
    this.skip[this.type] = true;
    this.matchBuffer.unshift.apply(this.matchBuffer,this.buffer);
    this.buffer = [];
    this.active = null;
    this.type = null;
}
