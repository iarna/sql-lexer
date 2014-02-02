"use strict";
var SQL92      = require('./sql92.js');
var StreamJSON = require('./stream-json.js');
var fs         = require('fs');

fs.createReadStream(__dirname+'/example.sql')
  .pipe(new SQL92.TraceLex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
