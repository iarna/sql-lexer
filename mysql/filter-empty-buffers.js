'use strict';
var util = require('util');
var stream = require('stream');

module.exports = function (dialect) {
    var FilterEmptyBuffers = function(options) {
        if (!options) options = {}
        options.objectMode = true;
        stream.Transform.call(this,options);
    }
    util.inherits(FilterEmptyBuffers,stream.Transform);
    FilterEmptyBuffers.prototype._transform = function(tokens,encoding,done) {
        for (var ii=0; ii<tokens.length; ++ii) {
            if (tokens[ii].type!=='$space' && tokens[ii].type!=='$comment' && tokens[ii].type!=='$commentCstyle') {
                this.push(tokens);
                break;
            }
        }
        done();
    }

    return FilterEmptyBuffers;
}
