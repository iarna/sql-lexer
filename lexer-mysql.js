'use strict';
var util = require('util');
var stream = require('stream');
var lexer = require('./lexer.js');
var SQL92 = require('./lexer-sql92.js');
var Pipes = require('./pipe-combiner.js');

var MySQL = module.exports = function() {
    Pipes.call(this, [new TokenMatcherL0(),new TokenMatcherL1(), new lexer.CoalesceTokens(), new MySQL.Delimiter()]);
}
util.inherits(MySQL, SQL92);

var TokenMatcherL0 = MySQL.TokenMatcherL0 = function(options) {
    SQL92.TokenMatcherL0.call(this,options);
    this.matchers = [
        '$space',
        '$comment',
        '$commentCstyle',
        '$string',
        '$identifierQuoted',
        '$letters',
        '$binLiteral',
        '$null',
        '$digits',
        '$symbol'
    ];
}
util.inherits(TokenMatcherL0,SQL92.TokenMatcherL0);

TokenMatcherL0.prototype.$symbol = function (char) {
    switch (char) {
    case '@':
    case '%':
    case '^':
        this.consume(char).complete();
        break;
    case '&':
        this.consume(char);
        this.active = function (char) {
            char==='&' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
        }
        break;	
    case '!':
        this.consume(char);
        this.active = function (char) {
            char==='=' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
        }
        break;
    case '<':
        this.consume(char);
        this.active = function (char) {
            switch (char) {
            case 'eof':
                this.consume().complete();
                break;
            case '<':
            case '>':
                this.consume(char).complete();
                break;
            case '=':
                this.consume(char);
                this.active = function (char) {
                    char==='>' ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
                }
                break;
            default:
                this.reject();
            }
        }
        break;
    case '>':
        this.consume(char);
        this.active = function (char) {
            (char==='=' || char==='>') ? this.consume(char).complete() : char==='eof' ? this.consume().complete() : this.reject();
        }
        break;
    default:
        SQL92.TokenMatcherL0.prototype.$symbol.call(this,char);
    }
}

var stringMatcher$ = MySQL.stringMatcher$ = function (delim,what) {
    return function (char) {
        if (char !== delim) return this.reject();
        var quoteEscape = function (char) {
            if (char !== delim) return this.complete();

            this.consume(char);
            this.active = stringChar;
        }
        var escapedChars = {
            '0': String.fromCharCode(0),
            "'": "'",
            '"': '"',
            '\\': '\\',
            'b': String.fromCharCode(8),
            'n': String.fromCharCode(10),
            'r': String.fromCharCode(13),
            't': String.fromCharCode(9),
            'Z': String.fromCharCode(26),
            '%': '\\%',
            '_': '\\_'
        }
        var slashEscape = function (char) {
            if (char==='eof') return this.error('unterminated '+what);
            this.consume( char in escapedChars ? escapedChars[char] : char );
            this.active = stringChar;
        }
        var stringChar = function (char) {
            if (char==='eof') return this.error('unterminated '+what);
            if (char!==delim) return this.consume(char);
            if (char === delim) {
                this.consume();
                this.active = quoteEscape;
            }
            else if (char === '\\') {
                this.consume();
                this.active = slashEscape;
            }
            else {
                this.consume(char);
            }
        }
        this.consume();
        this.active = stringChar;
    }
}


var $singleQuotedString = MySQL.stringMatcher$("'", 'string');

var $doubleQuotedString = MySQL.stringMatcher$('"', 'string');

TokenMatcherL0.prototype.$string = function (char) {
    if (char==="'") {
        return $singleQuotedString.call(this,char);
    }
    if (char==='"') {
        return $doubleQuotedString.call(this,char);
    }
    this.reject();
}

TokenMatcherL0.prototype.$identifierQuoted = SQL92.stringMatcher$('`', 'delimited identifier');

TokenMatcherL0.prototype.$commentCstyle = function (char) {
    if (char!=='/') return this.reject();
    this.consume();
    this.active = function (char) {
        if (char!=='*') return this.revert();
        this.consume();
        var maybeSlash = function (char) {
            if (char==='eof') return this.error('unterminated c-style comment');
            if (char==='/') return this.consume().complete();
            this.consume('*'+char);
            this.active = inComment;
        }
        var inComment = function (char) {
            if (char==='eof') return this.error('unterminated c-style comment');
            if (char!=='*') return this.consume(char);
            this.consume();
            this.active = maybeSlash;
        }
        return inComment;
    }
}

TokenMatcherL0.prototype.$null = function (char) {
    if (char!=='\\') return this.reject();
    this.consume(char);
    this.active = function (char) {
        if (char==='N') return this.consume(char).complete();
        this.error();
        this.match(char);
    }
}

TokenMatcherL0.prototype.$binLiteral = function (char) {
    if (char !== '0') return this.reject();
    this.consume();
    this.active = function (char) {
        if (char === 'x') {
            this.type = '$hexLiteral';
            this.consume();
            this.active = function (char) {
                if (char.match(/^[A-Fa-f0-9]$/)) {
                    this.consume(char);
                    this.active = function (char) {
                        char.match(/^[A-Fa-f0-9]$/) ? this.consume(char) : this.reject();
                    }
                    return;
                }
                this.complete('$digits','0');
                this.complete('$letters','x');
                this.reject();
            }
        }
        else if (char === 'b') {
            this.type = '$bitLiteral';
            this.consume();
            this.active = function (char) {
                if (char.match(/^[01]$/)) {
                    this.consume(char);
                    this.active = function (char) {
                        char.match(/^[01]$/) ? this.consume(char) : this.reject();
                    }
                    return;
                }
                this.complete('$digits','0');
                this.complete('$letters','b');
                this.reject();
            }
        }
        else {
            this.complete('$digits','0');
            this.reject();
            return;
        }
    }
}

var TokenMatcherL1 = MySQL.TokenMatcherL1 = function(options) {
    SQL92.TokenMatcherL1.call(this,options);
    this.matchers = [
        '$error',
        '$space',
        '$comment',
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
util.inherits(TokenMatcherL1,SQL92.TokenMatcherL1);

TokenMatcherL1.prototype.$hexLiteral = SQL92.$passthrough;
TokenMatcherL1.prototype.$bitLiteral = SQL92.$passthrough;
TokenMatcherL1.prototype.$null = SQL92.$passthrough;

TokenMatcherL1.prototype.$userDefined = function (token) {
    if (token.type!=='$symbol' || token.value !=='@') return this.reject();
    this.consume(token);
    this.active = SQL92.TokenMatcherL1.prototype.$bareword
}

var Delimiter = MySQL.Delimiter = function(options) {
    if (!options) options = {}
    options.objectMode = true;
    stream.Transform.call(this,options);
    this.delimiter = [{type:'$symbol', value:';'}];
    this.delimiterValue = ';';
    this.buffer = [];
    this.nextBuffer = [];
    this.atNewCommand = true;
    this.setNewDelimiter = false;
}
util.inherits(Delimiter,stream.Transform);

Delimiter.prototype.isBufferDelimiter = function () {
    if (this.buffer.length !== this.delimiter.length) return false;
    for (var ii=0; ii<this.delimiter.length-1; ++ii) {
        if (this.delimiter[ii].type !== this.buffer[ii].type
        ||  this.delimiter[ii].value !== this.buffer[ii].value) return false;
    }
    var last = this.delimiter.length-1;
    if (this.delimiter[last].type !== this.buffer[last].type) return false;
    if (this.delimiter[last].value === this.buffer[last].value) return true;
    if (this.delimiter[last].value !== this.buffer[last].value.substr(0,this.delimiter[last].value.length)) return false;
    // If the the first part of the last token matches we have to split it in two as the first portion is the delimiter
    // and the second portion is the start of the next command.
    this.nextBuffer.push({type: this.buffer[last].type, value: this.buffer[last].value.substr(this.delimiter[last].value.length)});
    this.buffer[last].value =  this.buffer[last].value.substr(0,this.delimiter[last].value.length);
    return true;
}

Delimiter.prototype.flushBuffer = function () {
    if (this.isBufferDelimiter()) {
        var delim = {
            type: '$delimiter',
            value: this.delimiterValue,
            pos: this.buffer[0].pos,
            row: this.buffer[0].row,
            col: this.buffer[0].col
        };
        this.push(delim);
    }
    else {
        for (var ii in this.buffer) this.push(this.buffer[ii]);
    }
    this.buffer = this.nextBuffer;
    this.nextBuffer = [];
}

Delimiter.prototype.isWhitespace = function(token) {
    return (token.type==='$space' || token.type==='$comment' || token.type==='$commentCstyle');
}

Delimiter.prototype.setDelimiterFromBuffer = function() {
    this.delimiter = this.buffer;
    this.delimiterValue = '';
    for (var ii in this.delimiter) this.delimiterValue += this.delimiter[ii].value;
    this.push({type:'$setdelimiter',value:this.delimiterValue, pos:this.setNewDelimiter.pos, row:this.setNewDelimiter.row, col:this.setNewDelimiter.col});
    this.setNewDelimiter = false;
}

// TODO: MySQL actually defines the DELIMITER command as (pcre):
// /^\s* DELIMITER \s+ (?<new-delimiter>\S+) [^\n]* \n$/x
// We don't fully support those symantics because they're crazy. =p
// We define a delimiter as (tokenstream):
// $whitespace := $space | $comment | $eof
// $setdelimiter := $whitespace* $bareword{DELIMITER} (?<new-delimiter> (!$whitespace)+ ) $whitespace
Delimiter.prototype._transform = function(token,encoding,done) {
    if (this.atNewCommand) {
        if (this.isWhitespace(token)) {
            this.push(token);
            return done();
        }
        else {
            this.atNewCommand = false;
            if (token.type==='$bareword' && token.value.toUpperCase()==='DELIMITER') {
                this.setNewDelimiter = token;
                return done();
            }
        }
    }
    if (this.setNewDelimiter) {
        // We don't report the spaces been the DELIMITER command and the new delimiter
        if (this.buffer.length==0 && this.isWhitespace(token)) {
            return done();
        }
        // Whitespace defines the end of a delimiter
        if (this.isWhitespace(token)) {
            this.setDelimiterFromBuffer();
            this.buffer = [token];
        }
        else {
            this.buffer.push(token);
        }
    }
    else {
        if (this.isBufferDelimiter()) {
            this.flushBuffer();
            this.atNewCommand = true;
        }
        this.buffer.push(token);
        if (this.buffer.length > this.delimiter.length) {
            this.push(this.buffer.shift());
        }
    }
    done();
}
Delimiter.prototype._flush = function(done) {
    if (! this.setNewDelimiter) { this.flushBuffer(); done(); return }
    if (this.buffer.length) { this.setDelimiterFromBuffer(); done(); return }
    var error = this.setNewDelimiter;
    error.type = '$error';
    this.push(error);
}
