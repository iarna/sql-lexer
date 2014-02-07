'use strict';
var MySQL = require('./mysql.js');
var fs = require('fs');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/example.sql';

fs.createReadStream(filename)
  .pipe(new MySQL.Lex())
  .pipe(new MySQL.Colorize())
  .pipe(process.stdout);
