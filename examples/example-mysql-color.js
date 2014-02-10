'use strict';
var fs = require('fs');
var MySQL = require('../mysql.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new MySQL.Lex())
  .pipe(new MySQL.Colorize())
  .pipe(process.stdout);
