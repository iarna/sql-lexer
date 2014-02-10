'use strict';
var fs = require('fs');
var MySQL = require('../mysql.js');
var StreamJSON = require('../util/stream-json.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new MySQL.Lex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
