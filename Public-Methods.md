Vanilla DataTables comes with a bunch of public methods for you to utilise. Just call the method after instantiating the plugin, like so:

```javascript
var datatable = new DataTable("#myTable");

datatable.methodnName();
```

---

### `refresh()`

Refreshes the table. This will recount the rows, reset any search and remove any set message, but will not reset any sorting.

---

### `page(num [int])`

Load a chosen page.

---