### `searchMethod`
#### Type: `function`
#### Default: `undefined`

A custom search method to be used for the column(s). The function should take 5 arguments:
`terms` (an array of strings representing the search terms),
`cell` (the cell that is to be checked for the search terms),
`row` (the data row that the cell is part of),
`column` (the id of the column of the cell),
`source` (a unique string given to a particular search interface so that multiple search itnerfaces can be used simultaneously).

It should return `true` if the search string is found in the data, `false` otherwise.

The default is that it simply checks for the presence of a particular search term in the cell content.

A `searchMethod` can also be defined for individual columns. If a `searchMethod` is defined for a column, it will override the
default `searchMethod` defined for the table.
