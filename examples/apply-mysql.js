'use strict';
var fs = require('fs');
var DSN = require('dsn');
var CondVar = require('cvar');

if (process.argv.length!==4) {
    console.error('apply.js filename dsn');
    process.exit(1);
}
var filename = process.argv[2];

var dsn = DSN.parse(process.argv[3]);
if (!dsn) {
    console.error('Could not parse your DSN');
    process.exit(1);
}
var dialect;
var connection;
switch (dsn.protocol) {
case 'mysql':
    dialect = require('../mysql.js');
    connection = require('mysql2').createConnection(dsn);
    break;
default:
    console.error('Unsupported SQL engine: '+dsn.protocol);
    process.exit(1);
}

var start = 0;

var output = new dialect.Lex();
output.pipe(new dialect.Colorize)
      .pipe(process.stdout);

var cv = CondVar();
cv.begin(function(){
    connection.end();
    output.end();
});

var chunknum = 0;
fs.createReadStream(filename)
  .pipe(new dialect.Lex())
  .pipe(new dialect.CompressWhitespace())
  .pipe(new dialect.BufferTokensByCommand())
  .pipe(new dialect.StripExtraWhitespace())
  .pipe(new dialect.StringifyTokenBuffers())
  .on('data', function (chunk) {
      var thischunk = ++chunknum;
      if (thischunk<start) return;
      if (chunk==='') return;
      cv.begin();
      connection.query(chunk, function(err, result, fields) {
          output.write("-- ------ "+(thischunk+" ---------------------------------------").slice(0,40)+ " --\n");
          output.write(chunk+"\n");
          if (err) {
              console.error(err);
              process.exit(1);
          }
          if (fields) {
              result.forEach(function(row){
                  output.write("-- "+JSON.stringify(row)+"\n");
              });
          }
          else {
              var rows = result.affectedRows==1?'row':'rows';
              output.write("-- " + result.affectedRows + " "+rows+" affected.\n");
          }
          output.write("-- ----------------------------------------------- --\n");
          cv.end();
      });
  })
  .on('end', function () {
      cv.end();
  })
