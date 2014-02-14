'use strict';
module.exports = function (dialect) {
    return function (token) {
        if (token.type==='$comment') {
            return '--' + token.value;
        }
        else if (token.type.match(/^[$][bxn]?string$/)) {
            var value = "'" + token.value.replace("'","''") + "'";
            if (token.type==='$bstring') {
                return 'B' + value;
            }
            else if (token.type==='$xstring') {
                return 'X' + value;
            }
            else if (token.type==='$nstring') {
                return 'N' + value;
            }
            else if (token.attr.charset) {
                return '_' + token.attr.charset + value;
            }
            return value;
        }
        else if (token.type==='$identifierQuoted') {
            return '"' + token.value.replace('"','""') + '"';
        }
        else {
            return token.value;
        }
    }
}