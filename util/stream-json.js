'use strict';
var util = require('util');
var stream = require('stream');

var StreamJSON = module.exports = function (options) {
    stream.Transform.call(this, options);
    this._writableState.objectMode = true;
    this._readableState.objectMode = false;
}
util.inherits(StreamJSON,stream.Transform);

StreamJSON.prototype._transform = function(data,encoding,done) {
    this.push( JSON.stringify(data)+'\n' );
    done();
}
