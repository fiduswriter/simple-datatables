The `columns` API allows access to the table columns for quick manipulation.

The allows for the selection of columns via either a single column index or `array` of column indexes:

```javascript
// Select the first, fourth and sixth columns
var columns = datatable.columns([0,3,5]);
```

You can then chain the following methods.

---

### `hide()`

Hides the selected column(s). The columns will not be visible and will be omitted from search results and exported data.

```javascript
// Hide the first and second columns
datatable.columns([0,1]).hide();

or 

var columns = datatable.columns([0,1]);
columns.hide();
```

---

### `show()`

Shows the selected column(s) (if hidden). The columns will be visible and will be included in search results and exported data.


```javascript
// Show the first and second columns
datatable.columns([0,1]).show();

or 

var columns = datatable.columns([0,1]);
columns.show();
```

---

### `visible()`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

---

### `hidden()`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

---