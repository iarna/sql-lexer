'use strict';
var util = require('util');
var stream = require('stream');

var CombineStrings = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.string = null;
    this.buffer = [];
}
util.inherits(CombineStrings,stream.Transform);

CombineStrings.prototype._transform = function(data,encoding,done) {
    if (this.string) {
        if (data.type==='$string') {
            this.buffer = [];
            this.string.value += data.value;
        }
        else if (data.type==='$space') {
            this.buffer.push(data);
        }
        else {
            this.push(this.string);
            for (var ii in this.buffer) {
                this.push(this.buffer[ii]);
            }
            this.string = null;
            this.buffer = [];
        }
    }
    else {
        if (data.type==='$string') {
            this.string = data;
        }
        else {
            this.push(data);
        }
    }
    done();
}

CombineStrings.prototype._flush = function() {
    if (! this.string) return;
    this.push(this.string);
    for (var ii in this.buffer) {
        this.push(this.buffer[ii]);
    }
}

module.exports = function (dialect) {
    return CombineStrings;
}
