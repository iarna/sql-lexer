'use strict';
var util = require('util');
var stream = require('stream');

module.exports = function (dialect) {
    var StripExtraWhitespace = function(options) {
        if (!options) options = {}
        options.objectMode = true;
        stream.Transform.call(this,options);
    }
    util.inherits(StripExtraWhitespace,stream.Transform);
    StripExtraWhitespace.prototype._transform = function(tokens,encoding,done) {
        var output = [];
        var whitespace = [];
        tokens.forEach(function(token){
            if (token.type==='$space' || token.type==='$comment' || token.type==='$commentCstyle') {
                if (output.length===0) return;
                whitespace.push(token);
            }
            else {
                if (whitespace.length) { output = output.concat(whitespace); whitespace = [] }
                output.push(token);
            }
        });
        this.push(output);
        done();
    }

    return StripExtraWhitespace;
}
