"use strict";
var SQL92 = require('./lexer-sql92.js'),
    Debug = require('./lexer-debug.js'),
    TokenDebug = require('./token-debugger.js'),
    fs    = require('fs');

var Scanner = SQL92.Scanner;
//Scanner = Debug.Scanner(Scanner);
var TokenMatcherL0 = SQL92.TokenMatcherL0
//TokenMatcherL0 = Debug.TokenMatcher(TokenMatcherL0);
var TokenMatcherL1 = SQL92.TokenMatcherL1
//TokenMatcherL1 = Debug.TokenMatcher(TokenMatcherL1);

var sql = fs.createReadStream(__dirname+'/example.sql');
sql.setEncoding("utf8");
sql.pipe(new Scanner({tokenMatcherL0: new TokenMatcherL0(), tokenMatcherL1: new TokenMatcherL1()}))
   .pipe(new TokenDebug())
   .pipe(process.stdout)
   .on('error',function (e){process.exit()});
