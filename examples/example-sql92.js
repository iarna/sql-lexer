'use strict';
var fs = require('fs');
var SQL92 = require('../sql92.js');
var StreamJSON = require('../util/stream-json.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new SQL92.Lex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
