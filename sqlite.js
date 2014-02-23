'use strict';
var SQLite = module.exports = {};

SQLite.TokenMatcherL0 = require('./sql92/token-matcher-L0.js')(SQLite);
SQLite.TokenMatcherL1 = require('./sqlite/token-matcher-L1.js')(SQLite);
SQLite.Lex            = require('./sql92/lexer.js')(SQLite);
SQLite.keyword        = require('./sql92/keywords.js')(SQLite);
SQLite.toSQL          = require('./sql92/token-to-sql.js')(SQLite);
SQLite.Colorize       = require('./sqlite/colorize.js')(SQLite);
SQLite.CoalesceTokens = require('./sql92/coalesce-tokens.js')(SQLite);
SQLite.CombineStrings = require('./sql92/combine-strings.js')(SQLite);
SQLite.TraceLex       = require('./sql92/trace-lexer.js')(SQLite);
SQLite.BufferTokensByCommand = require('./sqlite/buffer-tokens-by-command.js')(SQLite);
