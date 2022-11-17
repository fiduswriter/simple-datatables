Simple-DataTables fires it's own events which you can listen for by utilising the `.on()` method:

```javascript
let dataTable = new DataTable(myTable);

dataTable.on('datatable.XXXX', function(args) {
	// Do something when datatable.XXXX fires
});
```

### `datatable.init`
Fires when the table is fully rendered and ready for use.

### `datatable.page`
Fires on page change.

A single argument is available which returns the page number:

```javascript
dataTable.on('datatable.page', function(page) {
    //
});
```

### `datatable.perpage`
Fires when the perPage option is changed with the dropdown. A single argument returns the per-page value:

```javascript
dataTable.on('datatable.perpage', function(perpage) {
    //
});
```

### `datatable.refresh`
Fires when the `.refresh()` method is called.

### `datatable.search`
Fires on keyup during a search.

Two arguments are available: `query` which returns the query string entered and `matched` which returns an array of rows containing the matched string:

```javascript
dataTable.on('datatable.search', function(query, matched) {
    //
});
```

### `datatable.sort`
Fires when the table is sorted.

Two arguments are available when listening for this event: `column` which returns the column index and `direction` which returns the sort direction:

```javascript
dataTable.on('datatable.sort', function(column, direction) {
    //
});
```

### `datatable.update`
Fires when the `.update()` method is called.
