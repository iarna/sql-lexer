'use strict';

module.exports = function (dialect) {
    var tokenToSQL = require('../sql92/token-to-sql.js')(dialect);
    return function (token) {
        if (token.type === '$hexLiteral') {
            return '0x'+token.value;
        }
        else if (token.type === '$bitLiteral') {
            return '0b'+token.value;
        }
        else if (token.type === '$commentCstyle') {
            return '/*'+token.value+'*/';
        }
        else if (token.type === '$setdelimiter') {
            return 'DELIMITER ' + token.value;
        }
        else {
            return tokenToSQL(token);
        }
    }
}
