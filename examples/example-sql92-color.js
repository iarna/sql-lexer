'use strict';
var fs = require('fs');
var SQL92 = require('../sql92.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new SQL92.Lex())
  .pipe(new SQL92.Colorize())
  .pipe(process.stdout);
