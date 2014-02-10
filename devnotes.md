Current State
-------------

SQL92 is mostly complete, just missing:

* Character set specifier both string literals and identifiers
    \_[schemaname.]identifier
  SQL_TEXT is supposed to always be available

Similarly, MySQL support should be complete except for those (and COLLATE
<collation> suffixes).  This includes full support for alterable delimiters. 
Also should document outside of code the one way it differs from MySQL in
handling DELIMITER.

MySQL EOL comments don't currently match MySQL semantics.  MySQL only matches them if they're followed by whitespace.

MySQL is missing full tests as yet. Some need to be added to assert for the
various MySQL specific features.

Also, the colorizer really should be split into two pieces, one that
annotates colors, one that converts tokens into their SQL representations.

The latter will need to be extended for MySQL to make use of its various
string escapes.  Also to support outputting c-style comments.

Emitter will be:
Transform that coalesces commands together
Sink that runs queryies on node-mysql2

Lexical level limits to check, in SQL92:

identifiers no greater then 128 characters
national chars in N'' strings
bits only in B'' strings
hexits only in X'' strings
