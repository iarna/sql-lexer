'use strict';
var util = require('util');
var stream = require('stream');

var BufferTokensByCommand = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.buffer = [];
}
util.inherits(BufferTokensByCommand,stream.Transform);

BufferTokensByCommand.prototype.flushCommand = function () {
    this.push(this.buffer);
    this.buffer = [];
}

BufferTokensByCommand.prototype._transform = function(token,encoding,done) {
    if (token.type==='$delimiter') {
        this.flushCommand();
    }
    else {
        this.buffer.push(token);
    }
    done();
}
BufferTokensByCommand.prototype._flush = function(done) {
    this.flushCommand();
    done();
}

module.exports = function (dialect) {
    return BufferTokensByCommand;
}
