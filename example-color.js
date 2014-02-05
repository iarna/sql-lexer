'use strict';
var SQL92 = require('./sql92.js');
var fs = require('fs');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/example.sql';

fs.createReadStream(filename)
  .pipe(new SQL92.Lex())
  .pipe(new SQL92.Colorize())
  .pipe(process.stdout);
