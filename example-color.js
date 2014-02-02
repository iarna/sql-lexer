"use strict";
var SQL92 = require("./sql92.js");
var fs = require('fs');

fs.createReadStream(__dirname+'/example.sql')
  .pipe(new SQL92.Lex())
  .pipe(new SQL92.Colorize())
  .pipe(process.stdout);
