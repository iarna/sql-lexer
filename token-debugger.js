"use strict";
var util = require('util');
var stream = require('stream');

var tokendebugger = module.exports = function (options) {
    if (!options) options = {};
    options.objectMode = true;
    stream.Transform.call(this, options);
}
util.inherits(tokendebugger,stream.Transform);

tokendebugger.prototype._transform = function(data,encoding,done) {
    this.push( JSON.stringify(data)+"\n" );
    done();
}
