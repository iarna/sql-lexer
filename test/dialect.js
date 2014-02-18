'use strict';
var sql = require('../index.js');
var fs = require('fs');
var byline = require('byline');
var test = require('tape');
var collect = require('collect-events');

module.exports = function (dialect) {
    test(dialect, function (t) {
        var testdir = __dirname + '/'+dialect.toLowerCase()+'/';
        fs.readdir(testdir,function(err, files){
            if (err) throw err;
            var testCount = 0;
            files.forEach(function(file){
                var match;
                if (! (match = file.match(/(.*)[.]sql/))) { return }
                ++ testCount;
                var base = match[1];
                var parsed = [];
                var expected = [];
                collect.all(function(aggregate) {
                    fs.createReadStream(testdir+base+'.sql')
                      .pipe(new sql[dialect].Lex())
                      .on('data',function(token){ parsed.push(token) })
                      .on('end', aggregate());
                    var fh = fs.createReadStream(testdir+base+'.tokens');
                    fh.setEncoding('utf8');
                    fh.pipe(byline.createStream())
                      .on('data',function(line){ expected.push(JSON.parse(line)) })
                      .on('end', aggregate());
                }, function (err) {
                    if (err) throw err;
                    t.deepEqual( parsed, expected, dialect+' Tokens from '+base );
                });
            });
            t.plan(testCount);
        });
    });
}