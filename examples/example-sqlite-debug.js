'use strict';
var fs         = require('fs');
var SQLite      = require('../sqlite.js');
var StreamJSON = require('../util/stream-json.js');

var filename = process.argv[2];
if (!filename) filename = __dirname+'/data/example.sql';

fs.createReadStream(filename)
  .pipe(new SQLite.TraceLex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
