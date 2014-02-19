'use strict';
var util = require('util');

module.exports = function (dialect) {
    var SQL92TokenMatcherL1 = require('../sql92/token-matcher-L1.js')(dialect);

    var TokenMatcherL1 = function(options) {
        SQL92TokenMatcherL1.call(this,options);
        this.matchers = [
            '$error',
            '$space',
            '$comment',
            '$commentCstyle',
            '$charsetstring',
            '$bstring',
            '$xstring',
            '$nstring',
            '$string',
            '$identifierQuoted',
            '$hexLiteral',
            '$bitLiteral',
            '$null',
            '$bareword',
            '$approximateUnsignedNumber',
            '$approximateSignedNumber',
            '$exactUnsignedNumber',
            '$exactSignedNumber',
            '$userDefined',
            '$symbol',
            '$eof'
        ];
    }
    util.inherits(TokenMatcherL1,SQL92TokenMatcherL1);

    TokenMatcherL1.prototype.$comment = function () {
        if (this.token.type!=='$comment') return this.reject();
        var firstchar = this.token.value[0];
        if (firstchar!==' ' && firstchar!=='\n' && firstchar!=='\t') {
            return this.consume().error('End of line comments in MySQL MUST start with a whitespace character, not '+JSON.stringify(firstchar));
        }
        this.consume().complete();
    }
    TokenMatcherL1.prototype.$hexLiteral = SQL92TokenMatcherL1.$passthrough;
    TokenMatcherL1.prototype.$bitLiteral = SQL92TokenMatcherL1.$passthrough;
    TokenMatcherL1.prototype.$null = SQL92TokenMatcherL1.$passthrough;
    TokenMatcherL1.prototype.$commentCstyle = SQL92TokenMatcherL1.$passthrough;

    TokenMatcherL1.prototype.$userDefined = function () {
        if (this.token.type!=='$symbol' || this.token.value!=='@') return this.reject();
        this.consume();
        this.active = this.$bareword;
    }
    return TokenMatcherL1;
}

