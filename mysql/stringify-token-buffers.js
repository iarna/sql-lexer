'use strict';
var util = require('util');
var stream = require('stream');

module.exports = function (dialect) {
    var StringifyTokenBuffers = function(options) {
        if (!options) options = {}
        options.objectMode = true;
        stream.Transform.call(this,options);
    }
    util.inherits(StringifyTokenBuffers,stream.Transform);
    StringifyTokenBuffers.prototype._transform = function(tokens,encoding,done) {
        var output = '';
        tokens.forEach(function(token){
            output += dialect.toSQL(token);
        });
        this.push(output);
        done();
    }

    return StringifyTokenBuffers;
}
