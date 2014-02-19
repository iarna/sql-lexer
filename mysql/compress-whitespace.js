'use strict';
var util = require('util');
var stream = require('stream');

var CompressWhitespace = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.lastTokenWS = false;
}
util.inherits(CompressWhitespace,stream.Transform);
CompressWhitespace.prototype._transform = function(token,encoding,done) {
    if (token.type==='$space' || token.type==='$comment' || token.type==='$commentCstyle') {
        if (this.lastTokenWS) { return done() }
        this.lastTokenWS = true;
        token.type = '$space';
        token.value = ' ';
    }
    else {
        this.lastTokenWS = false;
    }
    this.push(token);
    done();
}

module.exports = function (dialect) {
    return CompressWhitespace;
}
