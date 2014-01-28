"use strict";
var util = require('util');
var stream = require('stream');

var Scanner = exports.Scanner = function (options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this, options);
    this.buffer = '';
    this.bufferPos = 0;
    this.streamPos = 0;
    if ( ! (this.tokenMatcher = options.tokenMatcher) ) {
        throw new Error('SQL Lexer requires a tokenMatcher in order to function');
    }
    this.tokenMatcher.lexer = this;
}
util.inherits(Scanner,stream.Transform);

Scanner.prototype.scan = function() {
    while (this.bufferPos<this.buffer.length) {
        var char = this.buffer.charAt(this.bufferPos);
        this.tokenMatcher.match( char );
    }
    return this;
}

Scanner.prototype._transform = function(data,encoding,done) {
    this.buffer = data;
    this.scan();
    this.tokenMatcher.eob();
    done();
    return this;
}

Scanner.prototype._flush = function () {
    this.tokenMatcher.eof();
    return this;
}

Scanner.prototype.emitToken = function(token) {
    this.push(token);
    return this;
}

Scanner.prototype.rewind = function(buffer) {
    this.bufferPos -= buffer.length;
    this.streamPos -= buffer.length;
    if (this.bufferPos < 0) {
        this.bufferStart += this.bufferPos;
        this.buffer = buffer.substr(0, 0-this.bufferPos) + this.buffer;
        this.bufferPos = 0;
    }
    return this;
}

Scanner.prototype.consume = function() {
    this.bufferPos ++;
    this.streamPos ++;
    if (this.bufferPos > this.buffer.length) { throw new Error("Consumed past end "+this.bufferPos+" > "+this.buffer.length) }
    return this;
}

var TokenMatcher = exports.TokenMatcher = function(lexer) {
    this.lexer = lexer;
    this.skip = {};
    this.active = this.detect;
    this.type = null;
    this.buffer = '';
    this.consumed = '';
    this.matchers = [];
}

TokenMatcher.prototype.match = function (char) {
    this.consumed += char;
    this.active(char);
    return this;
}

TokenMatcher.prototype.detect = function (char) {
    var bufferPos = this.lexer.bufferPos;
    for (var ii in this.matchers) {
        this.type = this.matchers[ii];
        if (this.skip[this.type]) continue;
        this[this.type].call(this,char);
        // If we consumed any characters then we had a match and can move on
        // to the next char. YES THIS IS AWFUL. =(
        if (bufferPos != this.lexer.bufferPos) return;
    }
    this.lexer.consume(char);
    this.lexer.emitToken({type: "$error", value: char, pos: this.lexer.streamPos});
    this.buffer = '';
    this.consumed = '';
    this.active = this.detect;
    this.skip = {};
    return this;
}

TokenMatcher.prototype.eof = function() {
    while (this.active !== this.detect) {
        if (this.active.EOF) {
            this.active.EOF.call(this);
        }
        else {
            this.lexer.rewind( this.consumed );
            this.skip[this.type] = true;
            this.active = this.detect;
            this.consumed = '';
            this.buffer = '';
            this.lexer.scan();
        }
    }
    return this;
}

TokenMatcher.prototype.eob = function() {
    if ((this.active !== this.detect) && this.active.EOB) this.active.EOB.call(this);
    return this;
}

TokenMatcher.prototype.consume = function(char) {
    if (char==null) char = '';
    if (this.active === this.detect) {
        this.active = this[this.type];
        this.tokenStart = this.lexer.streamPos;
    }
    this.buffer += char;
    this.lexer.consume();
    return this;
}

TokenMatcher.prototype.reject = function() {
    if (this.active !== this.detect) {
        if (this.buffer.length) {
            this.lexer.emitToken({type: this.type, value: this.buffer, pos: this.tokenStart});
            this.skip = {};
        }
        this.active = this.detect;
        this.buffer = '';
        this.consumed = '';
    }
    return this;
}

TokenMatcher.prototype.complete = function() {
    if (this.buffer.length) {
        this.lexer.emitToken({type: this.type, value: this.buffer, pos: this.tokenStart});
    }
    this.active = this.detect;
    this.buffer = '';
    this.consumed = '';
    this.skip = {};
    return this;
}
TokenMatcher.prototype.revert = function() {
    if (this.active !== this.detect) {
        // this is hinky =(
        // We consume the current character as it's already in
        // this.consumed, then rewind all of this.consumed
        // basically, this is all factored wroooong
        this.lexer.consume();
        this.lexer.rewind( this.consumed );

        this.skip[this.type] = true;
        this.active = this.detect;
        this.consumed = '';
        this.buffer = '';
    }
    return this;
}
