"use strict";
var util = require('util');
var stream = require('stream');

module.exports = function (dialect) {
    var TokenMatcherL1 = function(options) {
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
        while ((this.token = this.matchBuffer[0])) {
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

    TokenMatcherL1.prototype.reject = TokenMatcherL1.prototype.complete = function(type,attr) {
        if (!type) type = this.type;
        if (!type) return;
        if (!attr) attr = {};
        var value;
        if (this.active && this.active.value) {
            value = this.active.value.call(this);
        }
        else {
            value = '';
            this.buffer.forEach(function (token) { value += token.value });
        }
        if (this.active && this.active.attr) {
            attr = this.active.attr.call(this);
        }
        if (value.length) {
            var token = {};
            for (var key in this.buffer[0]) {
                token[key] = this.buffer[0][key];
            }
            token.type = type;
            for (var k in attr) { token.attr[k] = attr[k] }
            // We get an unmutated value for error tokens, as they don't
            // have any type-specific semantics
            token.value = (type==='$error')
                        ? dialect.toSQL({type: this.type, value: value, attr: token.attr})
                        : value;
            this.push(token);
            this.skip = {};
        }
        this.active = null;
        this.type = null;
        this.buffer = [];
        return this;
    }

    TokenMatcherL1.prototype.error = function(msg) {
        return this.complete('$error',{message: msg});
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

    return TokenMatcherL1;
}

