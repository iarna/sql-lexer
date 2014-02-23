'use strict';
var util = require('util');

module.exports = function (dialect) {
    var SQL92TokenMatcherL1 = require('../sql92/token-matcher-L1.js')(dialect);
    var TokenMatcherL1 = function(options) {
        SQL92TokenMatcherL1.call(this,options);
        this.matchers.unshift('$delimiter');
        this.matchers.unshift('$identifierQuotedMSSQL');
        this.matchers.unshift('$identifierQuotedMySQL');
    }
    util.inherits(TokenMatcherL1,SQL92TokenMatcherL1);

    TokenMatcherL1.prototype.$delimiter = function () {
        if (this.token.type!=='$symbol' || this.token.value!==';') { return this.reject() }
        this.consume().complete();
    }

    TokenMatcherL1.prototype.$identifierQuotedMSSQL = SQL92TokenMatcherL1.$passthrough;
    TokenMatcherL1.prototype.$identifierQuotedMySQL = SQL92TokenMatcherL1.$passthrough;

    return TokenMatcherL1;
}
