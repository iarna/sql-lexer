'use strict';
var sql = require('../index.js');
var fs = require('fs');
var StreamJSON = require('../stream-json.js');
var byline = require('byline');
var test = require("tape");

test("SQL92", function (t) {
    fs.readdir(__dirname+'/sql92/',function(err, files){
        if (err) throw err;
        var buf = {};
        var testCount = 0;
        files.forEach(function(file){
            var match;
            if (! (match = file.match(/(.*)[.]([^.]+)$/))) { return }
            var base = match[1];
            var ext = match[2];
            var tokens = [];
            var complete = function (test,index) {
               buf[test][index] = tokens;
               if (buf[test].length == 2) {
                   t.deepEqual(buf[test][0],buf[test][1],test);
                   delete buf[test];
               }
            }
            
            switch (ext) {
            case 'sql':
                ++ testCount;
                buf[base] = [];
                fs.createReadStream(__dirname+'/sql92/'+file)
                  .pipe(new sql.SQL92.Lex())
                  .on('data',function(token){ tokens.push(token) })
                  .on('end',function(){ complete(base,0) });
                break;
            case 'tokens':
                buf[base] = [];
                var fh = fs.createReadStream(__dirname+'/sql92/'+file);
                fh.setEncoding('utf8');
                fh.pipe(byline.createStream())
                  .on('data',function(line){ tokens.push(JSON.parse(line)) })
                  .on('end',function (){ complete(base, 1) });
                break;
            }
        });
        t.plan(testCount);
    });
});
