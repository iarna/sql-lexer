"use strict";
var util = require('util');
var stream = require('stream');

module.exports = function(stream,L0,L1) {
    if (!L0) L0 = TokenMatcherL0;
    if (!L1) L1 = TokenMatcherL1;
    stream.setEncoding('utf8');
    return stream.pipe(L0).pipe(L1);
}

var TokenMatcherL0 = module.exports.TokenMatcherL0 = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
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
    if (data instanceof Buffer) { return done(new Error("SQL lexer input stream must be in UTF8 mode")) }
    for (var ii=0; ii<data.length; ++ii) {
        this.match( data.charAt(ii) );
    }
    if ((this.active) && this.active.EOB) this.active.EOB.call(this);
    done();
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

TokenMatcherL0.prototype._flush = function() {
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
        this.push({
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

var TokenMatcherL1 = module.exports.TokenMatcherL1 = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.active = null;
    this.type = null;
    this.buffer = [];
    this.matchers = [];
    this.skip = {};
    this.matchBuffer = [];
}
util.inherits(TokenMatcherL1,stream.Transform);

TokenMatcherL1.prototype._transform = function(data,encoding,done) {
    this.match(data);
    done();
}

TokenMatcherL1.prototype._flush = function() {
    if (this.active) {
        if (this.active.EOF) {
            this.active.EOF.call(this);
        }
        else {
            this.revert();
        }
    }
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
        this.push({
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
