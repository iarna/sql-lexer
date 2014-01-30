"use strict";
var SQL92      = require('./lexer-sql92.js'),
    TokenDebug = require('./token-debugger.js'),
    fs         = require('fs');

SQL92(fs.createReadStream(__dirname+'/example.sql'))
   .pipe(new TokenDebug())
   .pipe(process.stdout).on('error',function (e){process.exit()});
