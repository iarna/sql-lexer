'use strict';
var fs = require('fs');
var DSN = require('dsn');
var Promisable = require('promisable');

if (process.argv.length<4) {
    console.error('apply.js dsn filename [skip]');
    process.exit(1);
}

var dsn = DSN.parse(process.argv[2]);
if (!dsn) {
    console.error('Could not parse your DSN');
    process.exit(1);
}

var filename = process.argv[3];

var start = process.argv[4] ? process.argv[4] : 0;

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

var output = new dialect.Lex();
output.pipe(new dialect.Colorize)
      .pipe(process.stdout);

var todo = Promisable.fulfill();

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
      todo = todo
          .thenPromise(function(R){
              output.write('-- ------ '+(thischunk+' ---------------------------------------').slice(0,40)+ ' --\n');
              output.write(chunk+'\n');
              connection.query(chunk, function(E,result,fields){R(E,[result,fields])});
          })
          .then(function(results) {
              var result = results[0];
              var fields = results[1];
              if (fields) {
                  result.forEach(function(row){
                      output.write('-- '+JSON.stringify(row)+'\n');
                  });
              }
              else {
                  var rows = result.affectedRows==1?'row':'rows';
                  output.write('-- ' + result.affectedRows + ' '+rows+' affected.\n');
              }
              output.write('-- ----------------------------------------------- --\n');
          })
          .catch(function(E){
              output.write('-- ====== ERROR ================================== --\n');
              output.write('-- '+E+'\n');
              output.write('-- ----------------------------------------------- --\n');
              output.write('-- To continue from after this statement, run:\n');
              output.write('-- apply "'+process.argv[2]+'" '+process.argv[3]+' '+(thischunk+1)+'\n');
              process.exit(1);
          });
  })
  .on('end', function () {
      todo(function(){
          connection.end();
          output.end();
      })
  })
