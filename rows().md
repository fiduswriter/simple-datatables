As of `v1.4.0`, the `rows` API is implemented and allows access to the table rows for quick manipulation.

To use the `rows` API just call the `rows()` method on the current instance:

```javascript
var rows = datatable.rows();
```

You can then chain the following methods.

---

### `add(data [array])`

Add new row data to the current instance. The `data` parameter must be an `array` of `strings` to be inserted into each of the new row's cells.

```javascript
var rows = datatable.rows();

var newRowData = ["column1", "column2", "column3", "column4", ...];

rows.add(newRowData);

```

---

### `remove(select [array|number])`

Remove existing rows from the current instance. The `select` parameter can either be an `integer` or `array` of `integers` representing the row indexes.

```javascript
var rows = datatable.rows();

// remove the 6th row
rows.remove(5);

// remove the first 5 rows
rows.remove([0,1,2,3,4]);

```

Note that the indexes passed to the this method should represent the actual index of the row in the [`data`](https://github.com/Mobius1/Vanilla-DataTables/wiki/API#data) array. The native [`rowIndex`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTableRowElement/rowIndex) property represents the position of a row in the rendered page and may be different to the index you need to pass to the `remove()` method. If you're on page 5 and you have `perPage` set to `5` the currently rendered rows will have `rowIndexes` of [0, 1, 2, 3, 4], but to remove them you would need to call `rows.remove([20, 21, 22, 23, 24])`.

---