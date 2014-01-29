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

To do in SQL92:

* Character set specifier both string literals and identifiers
    \_[schemaname.]identifier
  SQL_TEXT is supposed to always be available
* Command separators? Not really addressed by the standard =/
* Procs are poorly defined as well

General features:
* Gee, we'd like more then a byte position in a stream, but the current
  architecture makes that essentially impossible due to character level
  backtracking.  I think I could eliminate character level backtracking by
  splitting lexer into two parts.

  * Layer 1 do a very naive, non-backtracking parse that emits. Since these
    tokens wouldn't backtrack we could track line and col for them. This
    *would* mean having unclosed strings consume all of the text after the quote
    into an error token, but that's not necessarily bad.

    * whitespace
    * comments
    * delimited strings
    * letters
    * digits
    * symbols

  * Layer 2 would refine that by combining those pieces into the token
    stream we know today. This layer would backtrack.
 
* Regardless, we'll also need some extra layers to cleanup the stream:

  * Layer that combines error tokens and whitespace tokens (probably always useful)
  * Layer that combines string tokens eliding whitespace tokens between them
    (useful for parsers, not for the colorizer, possibly not for the
    appliers)

Tools:
* SQL colorizer that annotates output based on token types.
