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