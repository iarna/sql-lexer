'use strict';

module.exports = function (dialect) {
    var tokenToSQL = require('../sql92/token-to-sql.js')(dialect);
    return function (token) {
        if (token.type==='$identifierQuotedMySQL') {
            return '`' + token.value.replace('`','``') + '`';
        }
        else if (token.type==='$identifierQuotedMSSQL') {
            return '[' + token.value + ']';
        }
        else {
            return tokenToSQL(token);
        }
    }
}
