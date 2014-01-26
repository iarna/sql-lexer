"use strict";
var SQL92 = require('./lexer-sql92.js'),
    Debug = require('./lexer-debug.js'),
    TokenDebug = require('./token-debugger.js'),
    fs    = require('fs');

var Scanner = SQL92.Scanner;
//Scanner = Debug.Scanner(Scanner);
var TokenMatcher = SQL92.TokenMatcher
//TokenMatcher = Debug.TokenMatcher(TokenMatcher);

var sql = fs.createReadStream(__dirname+'/example.sql');
sql.setEncoding("utf8");
sql.pipe(new Scanner({tokenMatcher: new TokenMatcher()}))
   .pipe(new TokenDebug())
   .pipe(process.stdout)
   .on('error',function (e){process.exit()});
