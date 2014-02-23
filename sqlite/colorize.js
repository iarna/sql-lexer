'use strict';
var util = require('util'),
    clc = require('cli-color');

module.exports = function (dialect) {
    var ColorizeSQL92 = require('../sql92/colorize.js')(dialect);
    var ColorizeSQLite = module.exports = function (options) {
        ColorizeSQL92.call(this, options);
        this.colors.delimiter = clc.xterm(253);
    }
    util.inherits(ColorizeSQLite,ColorizeSQL92);

    ColorizeSQLite.prototype._transform = function (token,encoding,done) {
        if (token.type==='$delimiter') {
            this.push( this.colors.delimiter(dialect.toSQL(token)) );
        }
        else if (token.type==='$identifierQuotedMySQL' || token.type==='$identifierQuotedMSSQL') {
            this.push(this.colors.identifier(dialect.toSQL(token)));
        }
        else {
            return ColorizeSQL92.prototype._transform.call(this,token,encoding,done);
        }
        done();
    }

    return ColorizeSQLite;
}
