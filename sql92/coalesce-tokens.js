'use strict';
var util = require('util');
var stream = require('stream');

var CoalesceTokens = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
}
util.inherits(CoalesceTokens,stream.Transform);

CoalesceTokens.prototype.canCoalesce = function(type) {
    return type==='$error' || type==='$space' || type==='$digits' || type==='$letters';
}

CoalesceTokens.prototype._transform = function(data,encoding,done) {
    if (this.coalesce && this.coalesce.type!==data.type) {
        this.push(this.coalesce);
        this.coalesce = null;
    }
    if (this.canCoalesce(data.type)) {
        if (this.coalesce) {
            this.coalesce.value += data.value;
        }
        else {
            this.coalesce = data;
        }
    }
    else {
        this.push(data);
    }
    done();
}
CoalesceTokens.prototype._flush = function(done) {
    if (! this.coalesce) return done();
    this.push( this.coalesce );
    done();
}

module.exports = function (dialect) {
    return CoalesceTokens;
}
