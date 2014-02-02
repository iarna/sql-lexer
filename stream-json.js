"use strict";
var util = require('util');
var stream = require('stream');

var StreamJSON = module.exports = function (options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this, options);
}
util.inherits(StreamJSON,stream.Transform);

StreamJSON.prototype._transform = function(data,encoding,done) {
    this.push( JSON.stringify(data)+"\n" );
    done();
}
