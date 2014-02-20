'use strict';
var fs = require('fs');
var SQLite = require('../sqlite.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new SQLite.Lex())
  .pipe(new SQLite.Colorize())
  .pipe(process.stdout);
