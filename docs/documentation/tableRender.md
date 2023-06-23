### `tableRender`
#### Type: `boolean` \ `function(data, table, type)`
#### Default: `false`


If specified, declares a callback to customise the rendering of all tables. The function can take 3 parameters:

* **data**: the current state of the data as it exists in `dataTable.data`.

* **table**: the table in the format used by (diffDOM)[https://github.com/fiduswriter/diffDOM].

* **type**: a string representing the kind of table that is being drawn: `"main"` is the regular table, `"message"` is an empty table that is to include a message to the user, `"header"` is a special header table used for `scrollY`-tables, and `"print"` when the table is being rendered for printing.

You can either modify the table in place, or you can return a new table object in the same format.
