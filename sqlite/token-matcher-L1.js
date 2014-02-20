'use strict';
var util = require('util');

module.exports = function (dialect) {
    var SQL92TokenMatcherL1 = require('../sql92/token-matcher-L1.js')(dialect);
    var TokenMatcherL1 = function(options) {
        SQL92TokenMatcherL1.call(this,options);
        this.matchers.unshift('$delimiter');
    }
    util.inherits(TokenMatcherL1,SQL92TokenMatcherL1);

    TokenMatcherL1.prototype.$delimiter = function () {
        if (this.token.type!=='$symbol' || this.token.value!==';') { return this.reject() }
        this.consume().complete();
    }
    return TokenMatcherL1;
}
