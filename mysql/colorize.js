'use strict';
var util = require('util'),
    clc = require('cli-color');

module.exports = function (dialect) {
    var ColorizeSQL92 = require('../sql92/colorize.js')(dialect);
    var ColorizeMySQL = module.exports = function (options) {
        ColorizeSQL92.call(this, options);
        this.colors.delimiter = clc.xterm(253);
    }
    util.inherits(ColorizeMySQL,ColorizeSQL92);

    ColorizeMySQL.prototype._transform = function (token,encoding,done) {
        if (token.type==='$hexLiteral') {
            this.push(this.colors.string(dialect.toSQL(token)));
        }
        else if (token.type==='$bitLiteral') {
            this.push(this.colors.string(dialect.toSQL(token)));
        }
        else if (token.type==='$null') {
            this.push(this.colors.string(dialect.toSQL(token)));
        }
        else if (token.type==='$commentCstyle') {
            this.push(this.colors.string(dialect.toSQL(token)));
        }
        else if (token.type==='$delimiter') {
            this.push( this.colors.delimiter(dialect.toSQL(token)) );
        }
        else if (token.type==='$setdelimiter') {
            this.push( this.colors.delimiter(dialect.toSQL(token)) );
        }
        else {
            return ColorizeSQL92.prototype._transform.call(this,token,encoding,done);
        }
        done();
    }

    return ColorizeMySQL;
}
