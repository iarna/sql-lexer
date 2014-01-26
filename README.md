An SQL Lexer for JavaScript
---------------------------

This is the start of an SQL lexer for JavaScript.  When complete, it should
be able to produce tokens suitable for parsing standard SQL92 and SQL2011. 
Support for intervening versions is dependent on availability of
documentation.  Support for actual databases will follow, currently intended
are current stable versions of SQLite, Postgres and MySQL.

This library is intended to be the basis for other tools:

* Syntax highlighters
* Script executers that provide better diagnostics then dumping a .sql
  file into the commandline.
* Parsers, which can then SQL level diffs / migration help (ala
  [Modyllic](http://github.com/OnlineBuddies/Modyllic)), schema translation
  (ala [SQL::Translator](https://metacpan.org/pod/SQL::Translator)), and SQL
  quering of non-SQL backends (ala
  [DBD::CSV](https://metacpan.org/pod/DBD::CSV))
