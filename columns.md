As of `v1.2.0`, the `columns` API is implemented and allows access to the table columns for quick manipulation.

The API allows for the selection of columns via either a single `integer` representing a column index or and `array` of `integer`s representing multiple column indexes:

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

```javascript
// Select the fourth column
var columns = datatable.columns(3);

// Hide it
columns.hide();

// Check visiblilty
columns.visible() // returns false

or 

datatable.columns([0,1,2,3,4]).visible() // returns  [true, true, true, false, true]

```

---

### `hidden()`

Checks to see if the selected column(s) are visible. Returns a `boolean` for single indexes or an `array` of `boolean`s for multiple indexes.

---