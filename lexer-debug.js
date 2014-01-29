"use strict";
var util = require('util');

exports.Scanner = function(Scanner) {
    var DebugScanner = function (options) {
        console.log("CREATE SCANNER");
        Scanner.call(this,options);
    }
    util.inherits(DebugScanner,Scanner);
    DebugScanner.prototype._transform = function(data,encoding,done) {
        console.log("DATA", data);
        Scanner.prototype._transform.call(data,encoding,done);
    }
    return DebugScanner;
}

exports.TokenMatcher = function(TokenMatcher) {
    var DebugTokenMatcher = function (options) {
        console.log("CREATE TOKENMATCHER",options);
        TokenMatcher.call(this,options);
    }
    util.inherits(DebugTokenMatcher,TokenMatcher);
    DebugTokenMatcher.prototype.match = function (char) {
        console.log("MATCH",this.type, JSON.stringify(char));
        return TokenMatcher.prototype.match.call(this,char);
    }
    DebugTokenMatcher.prototype.detect = function (char) {
        console.log("DETECT",JSON.stringify(char));
        return TokenMatcher.prototype.detect.call(this,char);
    }
    DebugTokenMatcher.prototype.eof = function () {
        console.log("EOF");
        return TokenMatcher.prototype.eof.call(this);
    }
    DebugTokenMatcher.prototype.eob = function () {
        console.log("EOB");
        return TokenMatcher.prototype.eob.call(this);
    }
    DebugTokenMatcher.prototype.consume = function (char) {
        console.log("CONSUME",this.type,JSON.stringify(char));
        return TokenMatcher.prototype.consume.call(this,char);
    }
    DebugTokenMatcher.prototype.reject = function () {
        console.log("REJECT",this.type);
        return TokenMatcher.prototype.reject.call(this);
    }
    DebugTokenMatcher.prototype.complete = function (type,value) {
        console.log("COMPLETE",this.type,type,value);
        return TokenMatcher.prototype.complete.call(this,type,value);
    }
    DebugTokenMatcher.prototype.revert = function () {
        console.log("REVERT",this.type);
        return TokenMatcher.prototype.revert.call(this);
    }
    return DebugTokenMatcher;
}
