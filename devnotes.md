Current State
-------------

Just begun. From SQL92 it supports:

* Whitespace
* Strings (unmarked, bit, hex and natural language)
* Some symbols
* Barewords (identifers + keywords)
* Quoted identifiers (aka delimited identifiers)
* Comments
* Numbers
* Error/whitespace coalescing
* String combining as a separate layer

To do in SQL92:

* Character set specifier both string literals and identifiers
    \_[schemaname.]identifier
  SQL_TEXT is supposed to always be available
* Command separators? Not really addressed by the standard =/
* Procs are poorly defined as well
