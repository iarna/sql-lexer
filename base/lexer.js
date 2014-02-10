var util = require('util');
var stream = require('stream');

var TokenMatcherL0 = exports.TokenMatcherL0 = function(options) {
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
    if (char === '\n') {
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
    char === 'eof' ? this.consume() : this.consume(char).error();
}

TokenMatcherL0.prototype._flush = function(done) {
    if (this.active) this.active('eof');
    this.push(new this.Token('$eof',  '', this.streamPos, this.streamRow, this.streamCol));
    done();
}

TokenMatcherL0.prototype.consume = function(char,active) {
    if (char==='eof') throw new Error('Error in parser: Unexpected EOF while in '+this.type);
    if (char===null || typeof char == 'undefined') char = '';
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
        this.push(new this.Token(
            type ? type : this.type,
            value ? value : this.buffer,
            this.pos,
            this.row,
            this.col ));
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

var TokenMatcherL1 = exports.TokenMatcherL1 = function(options) {
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

TokenMatcherL1.prototype.match = function (token) {
    this.matchBuffer = [token];
    while (this.token = this.matchBuffer[0]) {
       this.active ? this.active() : this.detect();
    }
}

TokenMatcherL1.prototype.detect = function () {
    for (var ii in this.matchers) {
        this.type = this.matchers[ii];
        if (this.skip[this.type]) continue;
        this[this.type].call(this);
        if (! this.token) return;
    }
    this.consume().error(this.buffer);
}

TokenMatcherL1.prototype.consume = function() {
    if (! this.active) {
        this.active = this[this.type];
    }
    else if (this.token.type==='$eof') {
        throw new Error('Error in parser: Unexpected EOF while in '+this.type);
    }
    this.buffer.push(this.matchBuffer.shift());
    this.token = null;
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
        var token = {};
        for (var key in this.buffer[0]) {
            token[key] = this.buffer[0][key];
        }
        token.type = type;
        token.value = value;
        this.push(token);
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

TokenMatcherL1.prototype.revert = function() {
    if (!this.active) return this.reject();
    this.skip[this.type] = true;
    this.matchBuffer.unshift.apply(this.matchBuffer,this.buffer);
    this.buffer = [];
    this.active = null;
    this.type = null;
    return this;
}

