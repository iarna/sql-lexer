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
        else if (token.type === '$string') {
            var value = "'" + token.value.replace("'","''") + "'";
            value = value.replace(/\\(?![^%_])/,'\\\\');
            value = value.replace(String.fromCharCode(0), '\\0');
            value = value.replace(String.fromCharCode(8), '\\b');
            value = value.replace(String.fromCharCode(10), '\\n');
            value = value.replace(String.fromCharCode(13), '\\r');
            value = value.replace(String.fromCharCode(9), '\\t');
            value = value.replace(String.fromCharCode(26), '\\Z');
            if (token.type == '$bstring') {
                return 'B' + value;
            }
            else if (token.type == '$xstring') {
                return 'X' + value;
            }
            else if (token.type == '$nstring') {
                return 'N' + value;
            }
            else if (token.attr.charset) {
                return '_' + token.attr.charset + value;
            }
            return value;
        }
        else if (token.type === '$setdelimiter') {
            return 'DELIMITER ' + token.value;
        }
        else {
            return tokenToSQL(token);
        }
    }
}
