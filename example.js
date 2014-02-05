'use strict';
var SQL92 = require('./sql92.js');
var fs = require('fs');
var StreamJSON = require('./stream-json.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/example.sql';

fs.createReadStream(filename)
  .pipe(new SQL92.Lex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
