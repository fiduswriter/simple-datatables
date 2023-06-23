### `rowRender`
#### Type: `boolean` \ `function(rowValue, tr, index)`
#### Default: `false`


If specified, declares a callback to customise the rendering of all rows. The function can take 3 parameters:

* **rowValue**: the row as it exists in `dataTable.data.data`.

* **tr**: the table row in the format used by (diffDOM)[https://github.com/fiduswriter/diffDOM].

* **index**: the integer representing the index of the row in `dataTable.data.data`.

You can either modify the tr in place, or you can return a new tr object in the same format.
