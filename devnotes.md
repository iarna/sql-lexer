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

MySQL is missing full tests as yet. Some need to be added to assert for the
various MySQL specific features.
