simple-datatables fires its own events which you can listen for by utilising the `.on()` method:

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

### `datatable.selectrow`
Fires when user selects a row - either by mouse click on a row or using `Space`/`Enter` during keyboard based navigation (requires option [[rowNavigation]]).

Two arguments are available: `row` which returns the `<tr>` element that was selected and `event` which returns the event that caused the selection. You can run `event.preventDefault()` like this:

```javascript
dataTable.on("datatable.selectrow", (rowIndex, event) => {
    event.preventDefault();
    ...
});
```

See the [row navigation demo](../demos/14-row-navigation/index.html) for a more complete example.

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
