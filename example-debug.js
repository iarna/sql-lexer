"use strict";
var SQL92      = require('./lexer-sql92.js'),
    Debug      = require('./lexer-debug.js'),
    TokenDebug = require('./token-debugger.js'),
    fs         = require('fs');

var TokenMatcherL0 = new (Debug( SQL92.TokenMatcherL0 ));
var TokenMatcherL1 = new (Debug( SQL92.TokenMatcherL1 ));

fs.createReadStream(__dirname+'/example.sql').setEncoding('utf8')
  .pipe(TokenMatcherL0)
  .pipe(TokenMatcherL1)
  .pipe(new TokenDebug())
  .pipe(process.stdout).on('error',function (e){process.exit()});
