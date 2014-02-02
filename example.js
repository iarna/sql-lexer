"use strict";
var SQL92 = require("./sql92.js");
var fs = require('fs');
var StreamJSON = require('./stream-json.js');

fs.createReadStream(__dirname+'/example.sql')
  .pipe(new SQL92.Lex())
  .pipe(new StreamJSON())
  .pipe(process.stdout).on('error',function (e){process.exit()});
